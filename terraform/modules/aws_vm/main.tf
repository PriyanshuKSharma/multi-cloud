variable "region" {
  description = "AWS Region"
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 Instance Type"
  default     = "t2.micro"
}

variable "ami" {
  description = "AMI ID"
}

variable "instance_name" {
  description = "Name tag for the instance"
}

provider "aws" {
  region = var.region
}

resource "aws_instance" "vm" {
  ami           = var.ami
  instance_type = var.instance_type

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
