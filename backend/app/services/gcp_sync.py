"""
GCP Resource Synchronization Service
Fetches real-time resource inventory from Google Cloud using Google Cloud SDK
"""
from google.oauth2 import service_account
import googleapiclient.discovery
from typing import List, Dict, Optional
from datetime import datetime
import logging
import json

logger = logging.getLogger(__name__)


class GCPResourceSync:
    """Real-time GCP resource inventory sync"""
    
    def __init__(self, credentials: dict):
        """
        Initialize GCP clients with service account credentials
        
        Args:
            credentials: Dict with service account JSON data and 'project_id'
        """
        try:
            self.project_id = credentials['project_id']
            
            # Create credentials from service account info
            creds = service_account.Credentials.from_service_account_info(credentials)
            
            self.compute = googleapiclient.discovery.build('compute', 'v1', credentials=creds)
            self.storage = googleapiclient.discovery.build('storage', 'v1', credentials=creds)
            
        except Exception as e:
            logger.error(f"Failed to initialize GCP clients: {e}")
            raise
    
    def sync_compute_instances(self) -> List[dict]:
        """
        Fetch all Compute Engine instances across all zones
        
        Returns:
            List of instance dictionaries with standardized fields
        """
        try:
            instances = []
            
            # Use aggregatedList to get instances from all zones
            request = self.compute.instances().aggregatedList(project=self.project_id)
            
            while request is not None:
                response = request.execute()
                
                for zone, instances_scoped_list in response['items'].items():
                    if 'instances' in instances_scoped_list:
                        for instance in instances_scoped_list['instances']:
                            # Extract zone and region
                            zone_name = zone.split('/')[-1]
                            region = zone_name.rsplit('-', 1)[0] if zone_name != 'global' else 'global'
                            
                            # Extract IPs
                            public_ip = None
                            private_ip = None
                            
                            if 'networkInterfaces' in instance and instance['networkInterfaces']:
                                network_interface = instance['networkInterfaces'][0]
                                private_ip = network_interface.get('networkIP')
                                
                                if 'accessConfigs' in network_interface and network_interface['accessConfigs']:
                                    public_ip = network_interface['accessConfigs'][0].get('natIP')
                            
                            # Extract machine type
                            machine_type = instance.get('machineType', '').split('/')[-1]
                            
                            instances.append({
                                'resource_id': str(instance['id']),
                                'resource_name': instance['name'],
                                'resource_type': 'vm',
                                'status': instance['status'].lower(),
                                'region': region,
                                'instance_type': machine_type,
                                'public_ip': public_ip,
                                'private_ip': private_ip,
                                'resource_metadata': {
                                    'zone': zone_name,
                                    'creation_timestamp': instance.get('creationTimestamp'),
                                    'self_link': instance.get('selfLink'),
                                },
                                'tags': instance.get('labels', {})
                            })
                
                request = self.compute.instances().aggregatedList_next(request, response)
            
            logger.info(f"Synced {len(instances)} GCP Compute Engine instances")
            return instances
            
        except Exception as e:
            logger.error(f"Error syncing GCP Compute instances: {e}")
            return []
    
    def sync_storage_buckets(self) -> List[dict]:
        """
        Fetch all Cloud Storage buckets
        
        Returns:
            List of bucket dictionaries with standardized fields
        """
        try:
            buckets = []
            
            request = self.storage.buckets().list(project=self.project_id)
            
            while request is not None:
                response = request.execute()
                
                for bucket in response.get('items', []):
                    buckets.append({
                        'resource_id': bucket['id'],
                        'resource_name': bucket['name'],
                        'resource_type': 'storage',
                        'status': 'active',
                        'region': bucket.get('location', 'unknown'),
                        'resource_metadata': {
                            'storage_class': bucket.get('storageClass'),
                            'time_created': bucket.get('timeCreated'),
                            'self_link': bucket.get('selfLink'),
                        },
                        'tags': bucket.get('labels', {})
                    })
                
                request = self.storage.buckets().list_next(request, response)
            
            logger.info(f"Synced {len(buckets)} GCP Cloud Storage buckets")
            return buckets
            
        except Exception as e:
            logger.error(f"Error syncing GCP storage buckets: {e}")
            return []
    
    def sync_networks(self) -> List[dict]:
        """
        Fetch all VPC networks
        
        Returns:
            List of network dictionaries
        """
        try:
            networks = []
            
            request = self.compute.networks().list(project=self.project_id)
            response = request.execute()
            
            for network in response.get('items', []):
                networks.append({
                    'resource_id': str(network['id']),
                    'resource_name': network['name'],
                    'resource_type': 'network',
                    'status': 'active',
                    'region': 'global',  # Networks are global in GCP
                    'resource_metadata': {
                        'auto_create_subnetworks': network.get('autoCreateSubnetworks'),
                        'creation_timestamp': network.get('creationTimestamp'),
                        'self_link': network.get('selfLink'),
                    },
                    'tags': {}
                })
            
            logger.info(f"Synced {len(networks)} GCP VPC networks")
            return networks
            
        except Exception as e:
            logger.error(f"Error syncing GCP networks: {e}")
            return []
    
    def get_cost_data(self, start_date: str, end_date: str) -> Dict:
        """
        Fetch cost data from GCP Billing
        
        Note: This requires BigQuery billing export to be set up
        For now, returning placeholder
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict with cost breakdown
        """
        try:
            # GCP billing data would typically come from BigQuery export
            # This requires additional setup
            logger.warning("GCP cost data sync not yet implemented")
            return {'total_cost': 0, 'breakdown': []}
            
        except Exception as e:
            logger.error(f"Error fetching GCP cost data: {e}")
            return {'total_cost': 0, 'breakdown': []}
    
    def check_health(self) -> Dict:
        """
        Check GCP API connectivity and response time
        
        Returns:
            Dict with status, response_time_ms, error_message
        """
        start_time = datetime.now()
        
        try:
            # Simple API call to check connectivity
            self.compute.zones().list(project=self.project_id).execute()
            
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
