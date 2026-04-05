terraform {
  required_providers {
    azurerm = {
      source = "hashicorp/azurerm"
    }
  }
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

variable "resource_group_name" {
  description = "Azure resource group name"
  type        = string
}

variable "function_app_name" {
  description = "Azure Function App name"
  type        = string
}

variable "service_plan_name" {
  description = "Azure service plan name"
  type        = string
}

variable "storage_account_name" {
  description = "Azure storage account name (3-24 lowercase alphanumeric)"
  type        = string
}

variable "runtime_version" {
  description = "Python runtime version for Azure Functions"
  type        = string
  default     = "3.11"
}

variable "website_enabled" {
  description = "Enable dynamic website mode metadata"
  type        = bool
  default     = false
}

variable "trigger_type" {
  description = "Trigger type metadata for application code: http, schedule, event"
  type        = string
  default     = "http"
}

variable "trigger_source" {
  description = "Trigger source metadata (e.g., Event Grid source)"
  type        = string
  default     = ""
}

variable "schedule_expression" {
  description = "Schedule metadata for timer-triggered functions"
  type        = string
  default     = ""
}

variable "route_path" {
  description = "Route metadata for HTTP triggers"
  type        = string
  default     = "/"
}

variable "allowed_origins" {
  description = "Allowed origins metadata for CORS handling in function code"
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

variable "app_settings" {
  description = "Additional function app settings"
  type        = map(string)
  default     = {}
}

provider "azurerm" {
  features {}
}

locals {
  trigger_type_normalized = lower(trimspace(var.trigger_type))
  metadata_app_settings = {
    WEBSITE_MODE            = tostring(var.website_enabled)
    FUNCTION_TRIGGER_TYPE   = local.trigger_type_normalized
    FUNCTION_TRIGGER_SOURCE = var.trigger_source
    FUNCTION_ROUTE_PATH     = var.route_path
    FUNCTION_SCHEDULE       = var.schedule_expression
    ALLOWED_ORIGINS         = join(",", var.allowed_origins)
    ACTION_DESTINATION_URL  = var.action_destination_url
    ON_SUCCESS_DESTINATION  = var.on_success_destination
    ON_FAILURE_DESTINATION  = var.on_failure_destination
  }
}

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_storage_account" "sa" {
  name                     = var.storage_account_name
  resource_group_name      = azurerm_resource_group.rg.name
  location                 = azurerm_resource_group.rg.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}

resource "azurerm_service_plan" "plan" {
  name                = var.service_plan_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  os_type             = "Linux"
  sku_name            = "Y1"
}

resource "azurerm_linux_function_app" "function_app" {
  name                = var.function_app_name
  resource_group_name = azurerm_resource_group.rg.name
  location            = azurerm_resource_group.rg.location
  service_plan_id     = azurerm_service_plan.plan.id

  storage_account_name       = azurerm_storage_account.sa.name
  storage_account_access_key = azurerm_storage_account.sa.primary_access_key
  https_only                 = true

  identity {
    type = "SystemAssigned"
  }

  site_config {
    application_stack {
      python_version = var.runtime_version
    }
  }

  app_settings = merge(
    {
      FUNCTIONS_WORKER_RUNTIME = "python"
      WEBSITE_RUN_FROM_PACKAGE = "1"
    },
    local.metadata_app_settings,
    var.app_settings
  )
}

output "function_app_name" {
  value = azurerm_linux_function_app.function_app.name
}

output "function_app_hostname" {
  value = azurerm_linux_function_app.function_app.default_hostname
}

output "function_app_id" {
  value = azurerm_linux_function_app.function_app.id
}

output "function_url" {
  value = "https://${azurerm_linux_function_app.function_app.default_hostname}/api${var.route_path}"
}

output "trigger_type" {
  value = local.trigger_type_normalized
}

output "website_enabled" {
  value = var.website_enabled
}
