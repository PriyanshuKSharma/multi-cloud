variable "region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 Instance Type"
  default     = "t2.micro"
}

variable "ami" {
  description = "AMI ID. If empty, the latest Amazon Linux 2 AMI is used."
  type        = string
  default     = ""
}

data "aws_ami" "amazon_linux_2" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["amzn2-ami-hvm-*-x86_64-gp2"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

variable "instance_name" {
  description = "Name tag for the instance"
}

variable "subnet_id" {
  description = "Existing subnet ID to use. If empty, default subnet is used/created."
  type        = string
  default     = ""
}

variable "vpc_security_group_ids" {
  description = "Security Group IDs to attach"
  type        = list(string)
  default     = []
}

variable "key_name" {
  description = "Optional EC2 key pair name"
  type        = string
  default     = ""
}

provider "aws" {
  region = var.region
}

resource "aws_default_vpc" "default" {}

data "aws_availability_zones" "available" {
  state = "available"
}

resource "aws_default_subnet" "default" {
  availability_zone = data.aws_availability_zones.available.names[0]
  depends_on        = [aws_default_vpc.default]
}

locals {
  effective_subnet_id = trimspace(var.subnet_id) != "" ? var.subnet_id : aws_default_subnet.default.id
}

resource "aws_instance" "vm" {
  ami                    = trimspace(var.ami) != "" ? var.ami : data.aws_ami.amazon_linux_2.id
  instance_type          = var.instance_type
  subnet_id              = local.effective_subnet_id
  key_name               = trimspace(var.key_name) != "" ? var.key_name : null
  vpc_security_group_ids = length(var.vpc_security_group_ids) > 0 ? var.vpc_security_group_ids : null

  tags = {
    Name = var.instance_name
  }
}

output "instance_id" {
  value = aws_instance.vm.id
}

output "public_ip" {
  value = aws_instance.vm.public_ip
}
