output "api_endpoint" {
  description = "Backend Lambda URL"
  value       = aws_lambda_function_url.api_url.function_url
}

output "cloudfront_url" {
  description = "Frontend URL"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "ecr_repository_url" {
  description = "ECR Repository URL"
  value       = aws_ecr_repository.backend.repository_url
}

output "s3_bucket_name" {
  description = "S3 Bucket for Frontend"
  value       = aws_s3_bucket.frontend.id
}
