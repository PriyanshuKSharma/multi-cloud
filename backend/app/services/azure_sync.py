"""
Azure Resource Synchronization Service
Fetches real-time resource inventory from Azure using Azure SDK
"""
from azure.identity import ClientSecretCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.storage import StorageManagementClient
from azure.mgmt.resource import ResourceManagementClient
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


class AzureResourceSync:
    """Real-time Azure resource inventory sync"""
    
    def __init__(self, credentials: dict):
        """
        Initialize Azure clients with credentials
        
        Args:
            credentials: Dict with 'tenant_id', 'client_id', 'client_secret', 'subscription_id'
        """
        try:
            self.subscription_id = credentials['subscription_id']
            
            credential = ClientSecretCredential(
                tenant_id=credentials['tenant_id'],
                client_id=credentials['client_id'],
                client_secret=credentials['client_secret']
            )
            
            self.compute = ComputeManagementClient(credential, self.subscription_id)
            self.storage = StorageManagementClient(credential, self.subscription_id)
            self.resource = ResourceManagementClient(credential, self.subscription_id)
            
        except Exception as e:
            logger.error(f"Failed to initialize Azure clients: {e}")
            raise
    
    def _get_resource_group(self, resource_id: str) -> str:
        """Extract resource group name from Azure resource ID"""
        parts = resource_id.split('/')
        try:
            rg_index = parts.index('resourceGroups')
            return parts[rg_index + 1]
        except (ValueError, IndexError):
            return 'unknown'
    
    def sync_vms(self) -> List[dict]:
        """
        Fetch all Azure VMs
        
        Returns:
            List of VM dictionaries with standardized fields
        """
        try:
            vms = []
            
            for vm in self.compute.virtual_machines.list_all():
                resource_group = self._get_resource_group(vm.id)
                
                # Get instance view for detailed status
                try:
                    instance_view = self.compute.virtual_machines.instance_view(
                        resource_group,
                        vm.name
                    )
                    
                    # Extract power state
                    power_state = 'unknown'
                    for status in instance_view.statuses:
                        if status.code.startswith('PowerState/'):
                            power_state = status.code.split('/')[-1]
                            break
                    
                except Exception as view_error:
                    logger.warning(f"Could not get instance view for {vm.name}: {view_error}")
                    power_state = 'unknown'
                
                # Get network interfaces for IP addresses
                public_ip = None
                private_ip = None
                
                if vm.network_profile and vm.network_profile.network_interfaces:
                    # This would require additional API calls to get actual IPs
                    # For now, we'll leave them as None and enhance later
                    pass
                
                vms.append({
                    'resource_id': vm.id,
                    'resource_name': vm.name,
                    'resource_type': 'vm',
                    'status': power_state,
                    'region': vm.location,
                    'instance_type': vm.hardware_profile.vm_size if vm.hardware_profile else 'unknown',
                    'public_ip': public_ip,
                    'private_ip': private_ip,
                    'resource_metadata': {
                        'resource_group': resource_group,
                        'os_type': vm.storage_profile.os_disk.os_type if vm.storage_profile else 'unknown',
                        'vm_id': vm.vm_id,
                    },
                    'tags': vm.tags or {}
                })
            
            logger.info(f"Synced {len(vms)} Azure VMs")
            return vms
            
        except Exception as e:
            logger.error(f"Error syncing Azure VMs: {e}")
            return []
    
    def sync_storage_accounts(self) -> List[dict]:
        """
        Fetch all Azure storage accounts
        
        Returns:
            List of storage account dictionaries
        """
        try:
            accounts = []
            
            for account in self.storage.storage_accounts.list():
                resource_group = self._get_resource_group(account.id)
                
                accounts.append({
                    'resource_id': account.id,
                    'resource_name': account.name,
                    'resource_type': 'storage',
                    'status': account.status_of_primary.value if account.status_of_primary else 'unknown',
                    'region': account.location,
                    'resource_metadata': {
                        'resource_group': resource_group,
                        'sku': account.sku.name if account.sku else 'unknown',
                        'kind': account.kind.value if account.kind else 'unknown',
                        'creation_time': account.creation_time.isoformat() if account.creation_time else None,
                    },
                    'tags': account.tags or {}
                })
            
            logger.info(f"Synced {len(accounts)} Azure storage accounts")
            return accounts
            
        except Exception as e:
            logger.error(f"Error syncing Azure storage accounts: {e}")
            return []
    
    def sync_resource_groups(self) -> List[dict]:
        """
        Fetch all Azure resource groups
        
        Returns:
            List of resource group dictionaries
        """
        try:
            groups = []
            
            for rg in self.resource.resource_groups.list():
                groups.append({
                    'resource_id': rg.id,
                    'resource_name': rg.name,
                    'resource_type': 'resource_group',
                    'status': rg.properties.provisioning_state if rg.properties else 'unknown',
                    'region': rg.location,
                    'resource_metadata': {},
                    'tags': rg.tags or {}
                })
            
            logger.info(f"Synced {len(groups)} Azure resource groups")
            return groups
            
        except Exception as e:
            logger.error(f"Error syncing Azure resource groups: {e}")
            return []
    
    def get_cost_data(self, start_date: str, end_date: str) -> Dict:
        """
        Fetch cost data from Azure Cost Management
        
        Note: This requires additional setup and permissions
        For now, returning placeholder
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict with cost breakdown
        """
        try:
            # Azure Cost Management API implementation would go here
            # Requires azure-mgmt-costmanagement and proper permissions
            logger.warning("Azure cost data sync not yet implemented")
            return {'total_cost': 0, 'breakdown': []}
            
        except Exception as e:
            logger.error(f"Error fetching Azure cost data: {e}")
            return {'total_cost': 0, 'breakdown': []}
    
    def check_health(self) -> Dict:
        """
        Check Azure API connectivity and response time
        
        Returns:
            Dict with status, response_time_ms, error_message
        """
        start_time = datetime.now()
        
        try:
            # Simple API call to check connectivity
            list(self.resource.resource_groups.list())
            
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            
            return {
                'status': 'healthy' if response_time < 1000 else 'degraded',
                'response_time_ms': int(response_time),
                'error_message': None
            }
        except Exception as e:
            response_time = (datetime.now() - start_time).total_seconds() * 1000
            return {
                'status': 'error',
                'response_time_ms': int(response_time),
                'error_message': str(e)
            }
