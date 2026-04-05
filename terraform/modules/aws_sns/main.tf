terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}

variable "region" {
  description = "AWS region for the SNS topic"
  type        = string
  default     = "us-east-1"
}

variable "topic_name" {
  description = "SNS topic name"
  type        = string
}

variable "fifo_topic" {
  description = "Whether to create a FIFO topic"
  type        = bool
  default     = false
}

variable "content_based_deduplication" {
  description = "Enable content based deduplication for FIFO topic"
  type        = bool
  default     = false
}

variable "display_name" {
  description = "Display name for the topic (used for some protocols)"
  type        = string
  default     = ""
}

variable "delivery_policy" {
  description = "Optional JSON delivery policy"
  type        = string
  default     = ""
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
  topic_name_normalized = var.fifo_topic ? (
    endswith(var.topic_name, ".fifo") ? var.topic_name : "${var.topic_name}.fifo"
    ) : (
    endswith(var.topic_name, ".fifo") ? trimsuffix(var.topic_name, ".fifo") : var.topic_name
  )
}

resource "aws_sns_topic" "topic" {
  name                        = local.topic_name_normalized
  display_name                = trimspace(var.display_name) != "" ? var.display_name : null
  fifo_topic                  = var.fifo_topic
  content_based_deduplication = var.fifo_topic ? var.content_based_deduplication : null
  delivery_policy             = trimspace(var.delivery_policy) != "" ? var.delivery_policy : null
  tags                        = var.tags
}

output "topic_name" {
  value = aws_sns_topic.topic.name
}

output "topic_arn" {
  value = aws_sns_topic.topic.arn
}
