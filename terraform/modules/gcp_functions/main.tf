terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
    }
    archive = {
      source = "hashicorp/archive"
    }
  }
}

variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

variable "credentials_json" {
  description = "GCP service account JSON"
  type        = string
  default     = ""
  sensitive   = true
}

variable "function_name" {
  description = "Cloud Function name"
  type        = string
}

variable "runtime" {
  description = "Cloud Function runtime"
  type        = string
  default     = "python311"
}

variable "entry_point" {
  description = "Cloud Function entry point"
  type        = string
  default     = "handler"
}

variable "timeout_seconds" {
  description = "Function timeout in seconds"
  type        = number
  default     = 60
}

variable "memory_mb" {
  description = "Memory allocation in MB"
  type        = number
  default     = 256
}

variable "source_code" {
  description = "Inline Python source code for Cloud Function"
  type        = string
  default     = <<-PY
def handler(request):
    return "Hello from Cloud Simplify Cloud Function"
PY
}

locals {
  normalized_name_raw = trim(regexreplace(lower(var.function_name), "[^a-z0-9-]", "-"), "-")
  normalized_name     = length(local.normalized_name_raw) > 0 ? local.normalized_name_raw : "cloud-simplify-fn"
  source_bucket_name  = trim(substr("${local.normalized_name}-src-${substr(md5(var.function_name), 0, 8)}", 0, 63), "-")
}

provider "google" {
  project     = var.project_id
  region      = var.region
  credentials = var.credentials_json != "" ? var.credentials_json : null
}

data "archive_file" "function_source" {
  type        = "zip"
  output_path = "${path.module}/function-source.zip"

  source {
    content  = var.source_code
    filename = "main.py"
  }
}

resource "google_storage_bucket" "source_bucket" {
  name                        = local.source_bucket_name
  location                    = var.region
  force_destroy               = true
  uniform_bucket_level_access = true
}

resource "google_storage_bucket_object" "source_archive" {
  name   = "function-source-${substr(data.archive_file.function_source.output_base64sha256, 0, 8)}.zip"
  bucket = google_storage_bucket.source_bucket.name
  source = data.archive_file.function_source.output_path
}

resource "google_cloudfunctions_function" "function" {
  name                  = local.normalized_name
  description           = "Managed by Cloud Simplify"
  runtime               = var.runtime
  available_memory_mb   = var.memory_mb
  timeout               = var.timeout_seconds
  region                = var.region
  entry_point           = var.entry_point
  trigger_http          = true
  source_archive_bucket = google_storage_bucket.source_bucket.name
  source_archive_object = google_storage_bucket_object.source_archive.name
  https_trigger_security_level = "SECURE_ALWAYS"
}

output "function_name" {
  value = google_cloudfunctions_function.function.name
}

output "function_url" {
  value = google_cloudfunctions_function.function.https_trigger_url
}

output "function_id" {
  value = google_cloudfunctions_function.function.id
}
