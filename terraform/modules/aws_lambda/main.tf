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

provider "aws" {
  region = var.region
}

locals {
  role_name = substr("${var.function_name}-exec-role", 0, 64)
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

  depends_on = [aws_iam_role_policy_attachment.lambda_basic_execution]
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
