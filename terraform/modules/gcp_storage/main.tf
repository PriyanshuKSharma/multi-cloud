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

variable "bucket_name" {
  description = "GCP Bucket Name"
}

provider "google" {
  project     = var.project_id
  region      = var.region
  credentials = var.credentials_json != "" ? var.credentials_json : null
}

resource "google_storage_bucket" "bucket" {
  name          = var.bucket_name
  location      = "US"
  force_destroy = true
}

output "bucket_url" {
  value = google_storage_bucket.bucket.url
}
