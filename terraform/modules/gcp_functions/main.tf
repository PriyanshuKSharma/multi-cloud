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

variable "website_enabled" {
  description = "Expose function as a dynamic website/API endpoint"
  type        = bool
  default     = false
}

variable "trigger_type" {
  description = "Trigger type: http, pubsub, storage, event"
  type        = string
  default     = "http"
}

variable "trigger_resource" {
  description = "Trigger resource identifier (topic, bucket, or other event source)"
  type        = string
  default     = ""
}

variable "trigger_event_type" {
  description = "Event type override for non-http triggers"
  type        = string
  default     = ""
}

variable "event_retry_on_failure" {
  description = "Enable retry for event trigger failures"
  type        = bool
  default     = false
}

variable "route_path" {
  description = "Logical route path metadata for HTTP handlers"
  type        = string
  default     = "/"
}

variable "allowed_origins" {
  description = "Allowed CORS origins metadata for function code"
  type        = list(string)
  default     = ["*"]
}

variable "action_destination_url" {
  description = "Action destination URL metadata"
  type        = string
  default     = ""
}

variable "on_success_destination" {
  description = "Success destination metadata"
  type        = string
  default     = ""
}

variable "on_failure_destination" {
  description = "Failure destination metadata"
  type        = string
  default     = ""
}

variable "environment_variables" {
  description = "Additional environment variables"
  type        = map(string)
  default     = {}
}

locals {
  normalized_name_raw     = trim(regexreplace(lower(var.function_name), "[^a-z0-9-]", "-"), "-")
  normalized_name         = length(local.normalized_name_raw) > 0 ? local.normalized_name_raw : "cloud-simplify-fn"
  source_bucket_name      = trim(substr("${local.normalized_name}-src-${substr(md5(var.function_name), 0, 8)}", 0, 63), "-")
  trigger_type_normalized = lower(trimspace(var.trigger_type))
  use_http_trigger        = var.website_enabled || local.trigger_type_normalized == "http"
  use_event_trigger       = !local.use_http_trigger && trimspace(var.trigger_resource) != ""
  selected_event_type = trimspace(var.trigger_event_type) != "" ? var.trigger_event_type : (
    local.trigger_type_normalized == "storage" ? "google.storage.object.finalize" : "google.pubsub.topic.publish"
  )
  runtime_env_vars = {
    WEBSITE_MODE           = tostring(var.website_enabled)
    FUNCTION_ROUTE_PATH    = var.route_path
    FUNCTION_TRIGGER_TYPE  = local.trigger_type_normalized
    ALLOWED_ORIGINS        = join(",", var.allowed_origins)
    ACTION_DESTINATION_URL = var.action_destination_url
    ON_SUCCESS_DESTINATION = var.on_success_destination
    ON_FAILURE_DESTINATION = var.on_failure_destination
  }
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
  name                         = local.normalized_name
  description                  = "Managed by Cloud Simplify"
  runtime                      = var.runtime
  available_memory_mb          = var.memory_mb
  timeout                      = var.timeout_seconds
  region                       = var.region
  entry_point                  = var.entry_point
  trigger_http                 = local.use_http_trigger
  source_archive_bucket        = google_storage_bucket.source_bucket.name
  source_archive_object        = google_storage_bucket_object.source_archive.name
  https_trigger_security_level = local.use_http_trigger ? "SECURE_ALWAYS" : null
  environment_variables        = merge(local.runtime_env_vars, var.environment_variables)

  dynamic "event_trigger" {
    for_each = local.use_event_trigger ? [1] : []
    content {
      event_type = local.selected_event_type
      resource   = var.trigger_resource

      failure_policy {
        retry = var.event_retry_on_failure
      }
    }
  }
}

output "function_name" {
  value = google_cloudfunctions_function.function.name
}

output "function_url" {
  value = local.use_http_trigger ? google_cloudfunctions_function.function.https_trigger_url : null
}

output "function_id" {
  value = google_cloudfunctions_function.function.id
}

output "trigger_type" {
  value = local.trigger_type_normalized
}

output "website_enabled" {
  value = var.website_enabled
}
