variable "region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "network_name" {
  description = "VPC Name"
}

variable "cidr_block" {
  description = "CIDR block for the VPC"
  default     = "10.0.0.0/16"
}

variable "enable_dns_support" {
  description = "Enable DNS resolution in the VPC"
  type        = bool
  default     = true
}

variable "enable_dns_hostnames" {
  description = "Enable DNS hostnames in the VPC"
  type        = bool
  default     = true
}

provider "aws" {
  region = var.region
}

resource "aws_vpc" "network" {
  cidr_block           = var.cidr_block
  enable_dns_support   = var.enable_dns_support
  enable_dns_hostnames = var.enable_dns_hostnames

  tags = {
    Name = var.network_name
  }
}

output "vpc_id" {
  value = aws_vpc.network.id
}

output "cidr_block" {
  value = aws_vpc.network.cidr_block
}
