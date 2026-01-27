variable "region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 Bucket Name (must be unique)"
}

variable "environment" {
  description = "Environment (dev/prod)"
  default     = "dev"
}

provider "aws" {
  region = var.region
}

resource "aws_s3_bucket" "bucket" {
  bucket        = var.bucket_name
  force_destroy = true  # Useful for dev/demo environments to delete non-empty buckets

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
    ManagedBy   = "NebulaCode"
  }
}

output "bucket_name" {
  value = aws_s3_bucket.bucket.id
}

output "bucket_arn" {
  value = aws_s3_bucket.bucket.arn
}

output "region" {
  value = aws_s3_bucket.bucket.region
}
