import boto3
from azure.identity import ClientSecretCredential
from azure.mgmt.compute import ComputeManagementClient
from google.oauth2 import service_account
import googleapiclient.discovery
import json
from app.core.security import decrypt_data
from app.models.credential import CloudCredential
from sqlalchemy.orm import Session

class CloudSyncService:
    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def get_aws_counts(self, cred: CloudCredential):
        try:
            data = json.loads(decrypt_data(cred.encrypted_data))
            client = boto3.client(
                'ec2',
                aws_access_key_id=data['access_key'],
                aws_secret_access_key=data['secret_key'],
                region_name=data.get('region', 'us-east-1')
            )
            # Count running instances
            response = client.describe_instances(Filters=[{'Name': 'instance-state-name', 'Values': ['running']}])
            count = 0
            for r in response['Reservations']:
                count += len(r['Instances'])
            return count
        except Exception as e:
            print(f"AWS Sync Error: {e}")
            return 0

    def get_azure_counts(self, cred: CloudCredential):
        try:
            data = json.loads(decrypt_data(cred.encrypted_data))
            credential = ClientSecretCredential(
                tenant_id=data['tenant_id'],
                client_id=data['client_id'],
                client_secret=data['client_secret']
            )
            
            # VM Count
            compute_client = ComputeManagementClient(credential, data['subscription_id'])
            vms = list(compute_client.virtual_machines.list_all())
            vm_count = len(vms)
            
            # Storage Count (Simplified: counting storage accounts for now)
            # In a full impl, we'd use StorageManagementClient to count containers/blobs
            from azure.mgmt.storage import StorageManagementClient
            storage_client = StorageManagementClient(credential, data['subscription_id'])
            accounts = list(storage_client.storage_accounts.list())
            storage_count = len(accounts)
            
            return {
                "compute": vm_count,
                "storage": storage_count
            }
        except Exception as e:
             print(f"Azure Sync Error: {e}")
             return {"compute": 0, "storage": 0}

    def get_gcp_counts(self, cred: CloudCredential):
        # Placeholder for GCP implementation
        return {"compute": 0, "storage": 0}

    def get_aggregate_stats(self):
        creds = self.db.query(CloudCredential).filter(CloudCredential.user_id == self.user_id).all()
        
        stats = {
            "total_instances": 0,
            "aws_count": 0,
            "azure_count": 0,
            "gcp_count": 0,
            "details": [],
            "cost_by_provider": [],
            "cost_by_service": [
                {"name": "Compute", "value": 0.0},
                {"name": "Storage", "value": 0.0}
            ]
        }

        # Costs per instance type (Simulated)
        COSTS = {
            "aws": {"compute": 28.0, "storage": 5.0},
            "azure": {"compute": 32.0, "storage": 7.0},
            "gcp": {"compute": 24.0, "storage": 4.0}
        }

        for cred in creds:
            counts = {"compute": 0, "storage": 0}
            provider_name = cred.provider.upper()

            if cred.provider == 'aws':
                # AWS currently only returns computation count in get_aws_counts, 
                # let's adapt it to return a dict for consistency
                count = self.get_aws_counts(cred)
                counts["compute"] = count
                stats["aws_count"] += count
            elif cred.provider == 'azure':
                counts = self.get_azure_counts(cred)
                stats["azure_count"] += counts["compute"]
            elif cred.provider == 'gcp':
                counts = self.get_gcp_counts(cred)
                stats["gcp_count"] += counts["compute"]
            
            stats["total_instances"] += counts["compute"]
            
            # Calculate costs
            p_costs = COSTS.get(cred.provider, {"compute": 0, "storage": 0})
            compute_cost = counts["compute"] * p_costs["compute"]
            storage_cost = counts["storage"] * p_costs["storage"]
            total_cred_cost = compute_cost + storage_cost

            # Aggregate cost by provider
            existing = next((item for item in stats["cost_by_provider"] if item["name"] == provider_name), None)
            if existing:
                existing["cost"] += total_cred_cost
            else:
                stats["cost_by_provider"].append({"name": provider_name, "cost": total_cred_cost})

            # Aggregate cost by service
            stats["cost_by_service"][0]["value"] += compute_cost
            stats["cost_by_service"][1]["value"] += storage_cost

            stats["details"].append({
                "provider": cred.provider,
                "name": cred.name,
                "active_instances": counts["compute"],
                "active_storage": counts["storage"]
            })
            
        return stats
