terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    archive = {
      source = "hashicorp/archive"
    }
  }
}

variable "region" {
  description = "AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "function_name" {
  description = "Lambda function name"
  type        = string
}

variable "runtime" {
  description = "Lambda runtime"
  type        = string
  default     = "python3.11"
}

variable "handler" {
  description = "Lambda handler"
  type        = string
  default     = "index.lambda_handler"
}

variable "description" {
  description = "Lambda function description"
  type        = string
  default     = "Managed by Cloud Simplify"
}

variable "timeout" {
  description = "Lambda timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Lambda memory size in MB"
  type        = number
  default     = 128
}

variable "source_code" {
  description = "Inline Python source code for the Lambda function"
  type        = string
  default     = <<-PY
def lambda_handler(event, context):
    return {
        "statusCode": 200,
        "body": "Hello from Cloud Simplify Lambda"
    }
PY
}

variable "website_enabled" {
  description = "Expose the function through a public Function URL for dynamic website/API hosting"
  type        = bool
  default     = false
}

variable "trigger_type" {
  description = "Trigger type: http, schedule, storage, queue"
  type        = string
  default     = "http"
}

variable "route_path" {
  description = "Logical route path for website/API handlers (metadata only)"
  type        = string
  default     = "/"
}

variable "schedule_expression" {
  description = "CloudWatch schedule expression for scheduled invocations"
  type        = string
  default     = ""
}

variable "event_source_arn" {
  description = "Event source ARN (for queue trigger)"
  type        = string
  default     = ""
}

variable "event_source_bucket" {
  description = "S3 bucket name for storage trigger"
  type        = string
  default     = ""
}

variable "allowed_origins" {
  description = "Allowed origins for Lambda Function URL CORS"
  type        = list(string)
  default     = ["*"]
}

variable "action_destination_url" {
  description = "Action destination URL exposed to function code"
  type        = string
  default     = ""
}

variable "on_success_destination_arn" {
  description = "Async invocation success destination ARN (SNS/SQS/Lambda/EventBridge)"
  type        = string
  default     = ""
}

variable "on_failure_destination_arn" {
  description = "Async invocation failure destination ARN (SNS/SQS/Lambda/EventBridge)"
  type        = string
  default     = ""
}

variable "environment_variables" {
  description = "Extra environment variables"
  type        = map(string)
  default     = {}
}

provider "aws" {
  region = var.region
}

locals {
  role_name               = substr("${var.function_name}-exec-role", 0, 64)
  trigger_type_normalized = lower(trimspace(var.trigger_type))
  use_http_trigger        = var.website_enabled || local.trigger_type_normalized == "http"
  use_schedule_trigger    = local.trigger_type_normalized == "schedule" && trimspace(var.schedule_expression) != ""
  use_storage_trigger     = local.trigger_type_normalized == "storage" && trimspace(var.event_source_bucket) != ""
  use_queue_trigger       = local.trigger_type_normalized == "queue" && trimspace(var.event_source_arn) != ""
  has_async_destinations  = trimspace(var.on_success_destination_arn) != "" || trimspace(var.on_failure_destination_arn) != ""
  default_runtime_env_vars = {
    WEBSITE_MODE           = tostring(var.website_enabled)
    FUNCTION_ROUTE_PATH    = var.route_path
    FUNCTION_TRIGGER_TYPE  = local.trigger_type_normalized
    ACTION_DESTINATION_URL = var.action_destination_url
    ON_SUCCESS_DESTINATION = var.on_success_destination_arn
    ON_FAILURE_DESTINATION = var.on_failure_destination_arn
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"

  source {
    content  = var.source_code
    filename = "index.py"
  }
}

resource "aws_iam_role" "lambda_exec_role" {
  name = local.role_name

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "function" {
  function_name    = var.function_name
  role             = aws_iam_role.lambda_exec_role.arn
  handler          = var.handler
  runtime          = var.runtime
  timeout          = var.timeout
  memory_size      = var.memory_size
  description      = var.description
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  publish          = true

  environment {
    variables = merge(local.default_runtime_env_vars, var.environment_variables)
  }

  depends_on = [aws_iam_role_policy_attachment.lambda_basic_execution]
}

resource "aws_lambda_function_url" "website" {
  count              = local.use_http_trigger ? 1 : 0
  function_name      = aws_lambda_function.function.function_name
  authorization_type = "NONE"

  cors {
    allow_credentials = false
    allow_origins     = var.allowed_origins
    allow_methods     = ["*"]
    allow_headers     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age           = 3600
  }
}

resource "aws_cloudwatch_event_rule" "schedule" {
  count               = local.use_schedule_trigger ? 1 : 0
  name                = substr("${var.function_name}-schedule", 0, 64)
  schedule_expression = var.schedule_expression
}

resource "aws_cloudwatch_event_target" "schedule_target" {
  count     = local.use_schedule_trigger ? 1 : 0
  rule      = aws_cloudwatch_event_rule.schedule[0].name
  target_id = substr("${var.function_name}-target", 0, 64)
  arn       = aws_lambda_function.function.arn
}

resource "aws_lambda_permission" "allow_schedule" {
  count         = local.use_schedule_trigger ? 1 : 0
  statement_id  = "AllowExecutionFromCloudWatchSchedule"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.function.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.schedule[0].arn
}

data "aws_s3_bucket" "trigger_bucket" {
  count  = local.use_storage_trigger ? 1 : 0
  bucket = var.event_source_bucket
}

resource "aws_lambda_permission" "allow_s3" {
  count         = local.use_storage_trigger ? 1 : 0
  statement_id  = "AllowExecutionFromS3"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.function.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = data.aws_s3_bucket.trigger_bucket[0].arn
}

resource "aws_s3_bucket_notification" "storage_trigger" {
  count  = local.use_storage_trigger ? 1 : 0
  bucket = data.aws_s3_bucket.trigger_bucket[0].id

  lambda_function {
    lambda_function_arn = aws_lambda_function.function.arn
    events              = ["s3:ObjectCreated:*"]
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

resource "aws_lambda_event_source_mapping" "queue_trigger" {
  count            = local.use_queue_trigger ? 1 : 0
  event_source_arn = var.event_source_arn
  function_name    = aws_lambda_function.function.arn
  enabled          = true
}

resource "aws_lambda_function_event_invoke_config" "async_destinations" {
  count         = local.has_async_destinations ? 1 : 0
  function_name = aws_lambda_function.function.function_name
  qualifier     = aws_lambda_function.function.version

  destination_config {
    dynamic "on_success" {
      for_each = trimspace(var.on_success_destination_arn) != "" ? [var.on_success_destination_arn] : []
      content {
        destination = on_success.value
      }
    }

    dynamic "on_failure" {
      for_each = trimspace(var.on_failure_destination_arn) != "" ? [var.on_failure_destination_arn] : []
      content {
        destination = on_failure.value
      }
    }
  }
}

output "function_name" {
  value = aws_lambda_function.function.function_name
}

output "function_arn" {
  value = aws_lambda_function.function.arn
}

output "invoke_arn" {
  value = aws_lambda_function.function.invoke_arn
}

output "function_url" {
  value = local.use_http_trigger ? aws_lambda_function_url.website[0].function_url : null
}

output "trigger_type" {
  value = local.trigger_type_normalized
}

output "website_enabled" {
  value = var.website_enabled
}
