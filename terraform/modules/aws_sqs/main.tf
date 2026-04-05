terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "region" {
  description = "AWS region for the SQS queue"
  type        = string
  default     = "us-east-1"
}

variable "queue_name" {
  description = "SQS queue name"
  type        = string
}

variable "fifo_queue" {
  description = "Whether to create a FIFO queue"
  type        = bool
  default     = false
}

variable "content_based_deduplication" {
  description = "Enable content based deduplication for FIFO queues"
  type        = bool
  default     = false
}

variable "visibility_timeout_seconds" {
  description = "Visibility timeout for messages"
  type        = number
  default     = 30
}

variable "message_retention_seconds" {
  description = "Message retention period in seconds"
  type        = number
  default     = 345600
}

variable "delay_seconds" {
  description = "Default delivery delay for messages"
  type        = number
  default     = 0
}

variable "max_message_size" {
  description = "Maximum message size in bytes"
  type        = number
  default     = 262144
}

variable "receive_wait_time_seconds" {
  description = "Long polling wait time in seconds"
  type        = number
  default     = 0
}

variable "enable_dlq" {
  description = "Create and attach a dead-letter queue"
  type        = bool
  default     = false
}

variable "dlq_name" {
  description = "Dead-letter queue name"
  type        = string
  default     = ""
}

variable "redrive_max_receive_count" {
  description = "How many receives before message moves to DLQ"
  type        = number
  default     = 5
}

variable "tags" {
  description = "Resource tags"
  type        = map(string)
  default     = {}
}

provider "aws" {
  region = var.region
}

locals {
  queue_name_normalized = var.fifo_queue ? (
    endswith(var.queue_name, ".fifo") ? var.queue_name : "${var.queue_name}.fifo"
    ) : (
    endswith(var.queue_name, ".fifo") ? trimsuffix(var.queue_name, ".fifo") : var.queue_name
  )

  dlq_name_normalized = var.fifo_queue ? (
    endswith(var.dlq_name, ".fifo") ? var.dlq_name : "${var.dlq_name}.fifo"
    ) : (
    endswith(var.dlq_name, ".fifo") ? trimsuffix(var.dlq_name, ".fifo") : var.dlq_name
  )
}

resource "aws_sqs_queue" "dead_letter" {
  count = var.enable_dlq ? 1 : 0

  name                        = local.dlq_name_normalized != "" ? local.dlq_name_normalized : "${local.queue_name_normalized}-dlq"
  fifo_queue                  = var.fifo_queue
  content_based_deduplication = var.fifo_queue ? var.content_based_deduplication : null
  message_retention_seconds   = var.message_retention_seconds
  tags                        = var.tags
}

resource "aws_sqs_queue" "main" {
  name                        = local.queue_name_normalized
  fifo_queue                  = var.fifo_queue
  content_based_deduplication = var.fifo_queue ? var.content_based_deduplication : null
  visibility_timeout_seconds  = var.visibility_timeout_seconds
  message_retention_seconds   = var.message_retention_seconds
  delay_seconds               = var.delay_seconds
  max_message_size            = var.max_message_size
  receive_wait_time_seconds   = var.receive_wait_time_seconds
  tags                        = var.tags

  redrive_policy = var.enable_dlq ? jsonencode({
    deadLetterTargetArn = aws_sqs_queue.dead_letter[0].arn
    maxReceiveCount     = var.redrive_max_receive_count
  }) : null
}

output "queue_name" {
  value = aws_sqs_queue.main.name
}

output "queue_url" {
  value = aws_sqs_queue.main.url
}

output "queue_arn" {
  value = aws_sqs_queue.main.arn
}

output "dlq_queue_name" {
  value = var.enable_dlq ? aws_sqs_queue.dead_letter[0].name : null
}

output "dlq_queue_url" {
  value = var.enable_dlq ? aws_sqs_queue.dead_letter[0].url : null
}

output "dlq_queue_arn" {
  value = var.enable_dlq ? aws_sqs_queue.dead_letter[0].arn : null
}
