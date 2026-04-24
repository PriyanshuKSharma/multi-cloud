variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-south-1"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "nebula-multicloud"
}

variable "db_password" {
  description = "RDS root password"
  type        = string
  sensitive   = true
}

variable "db_username" {
  description = "RDS root username"
  type        = string
  default     = "nebula_admin"
}
