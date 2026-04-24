variable "location" {
  description = "Azure Region"
  default     = "East US"
}

variable "resource_group_name" {
  description = "Resource Group Name"
}

variable "network_name" {
  description = "Virtual Network Name"
}

variable "cidr_block" {
  description = "CIDR block for the VNet"
  default     = "10.0.0.0/16"
}

provider "azurerm" {
  features {}
}

resource "azurerm_resource_group" "rg" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_virtual_network" "vnet" {
  name                = var.network_name
  address_space       = [var.cidr_block]
  location            = azurerm_resource_group.rg.location
  resource_group_name = azurerm_resource_group.rg.name
}

output "vnet_id" {
  value = azurerm_virtual_network.vnet.id
}

output "resource_group_name" {
  value = azurerm_resource_group.rg.name
}
