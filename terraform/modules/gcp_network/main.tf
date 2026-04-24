variable "project_id" {
  description = "GCP Project ID"
}

variable "credentials_json" {
  description = "GCP service account JSON"
  type        = string
  default     = ""
  sensitive   = true
}

variable "region" {
  description = "GCP Region"
  default     = "us-central1"
}

variable "network_name" {
  description = "VPC network name"
}

variable "cidr_block" {
  description = "CIDR block for the subnet"
  default     = "10.0.0.0/16"
}

variable "enable_private_access" {
  description = "Enable private Google access on the subnet"
  type        = bool
  default     = true
}

provider "google" {
  project     = var.project_id
  region      = var.region
  credentials = var.credentials_json != "" ? var.credentials_json : null
}

resource "google_compute_network" "vpc_network" {
  name                    = var.network_name
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet" {
  name                     = "${var.network_name}-subnet"
  ip_cidr_range            = var.cidr_block
  region                   = var.region
  network                  = google_compute_network.vpc_network.id
  private_ip_google_access  = var.enable_private_access
}

output "network_id" {
  value = google_compute_network.vpc_network.id
}

output "subnet_id" {
  value = google_compute_subnetwork.subnet.id
}
