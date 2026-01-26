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
            client = ComputeManagementClient(credential, data['subscription_id'])
            # Simple count of all VMs in all resource groups
            # Note: This iterates pages, for MVP we just take strict list
            vms = list(client.virtual_machines.list_all())
            return len(vms)
        except Exception as e:
             print(f"Azure Sync Error: {e}")
             return 0

    def get_gcp_counts(self, cred: CloudCredential):
        # Placeholder for GCP implementation
        return 0

    def get_aggregate_stats(self):
        creds = self.db.query(CloudCredential).filter(CloudCredential.user_id == self.user_id).all()
        
        stats = {
            "total_instances": 0,
            "aws_count": 0,
            "azure_count": 0,
            "gcp_count": 0,
            "details": []
        }

        for cred in creds:
            count = 0
            if cred.provider == 'aws':
                count = self.get_aws_counts(cred)
                stats["aws_count"] += count
            elif cred.provider == 'azure':
                count = self.get_azure_counts(cred)
                stats["azure_count"] += count
            elif cred.provider == 'gcp':
                count = self.get_gcp_counts(cred)
                stats["gcp_count"] += count
            
            stats["total_instances"] += count
            stats["details"].append({
                "provider": cred.provider,
                "name": cred.name,
                "active_instances": count
            })
            
        return stats
