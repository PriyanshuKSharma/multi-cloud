# Cloud Provider Integration Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [AWS Integration](#2-aws-integration)
3. [Azure Integration](#3-azure-integration)
4. [GCP Integration](#4-gcp-integration)
5. [Credential Management](#5-credential-management)
6. [Resource Synchronization](#6-resource-synchronization)
7. [Cost Data Integration](#7-cost-data-integration)

---

## 1. Overview

The platform integrates with **three major cloud providers**:

- **AWS** (Amazon Web Services)
- **Azure** (Microsoft Azure)
- **GCP** (Google Cloud Platform)

**Integration Capabilities:**

- ✅ Resource discovery (VMs, Storage, Networks)
- ✅ Real-time synchronization
- ✅ Cost data retrieval
- ✅ Health monitoring
- ✅ Terraform provisioning

---

## 2. AWS Integration

### 2.1 Required Credentials

**IAM User with programmatic access:**

- Access Key ID
- Secret Access Key
- Region (default: us-east-1)

**Required IAM Permissions:**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeRegions",
        "ec2:DescribeVpcs",
        "ec2:DescribeSubnets",
        "ec2:DescribeSecurityGroups",
        "s3:ListAllMyBuckets",
        "s3:GetBucketLocation",
        "s3:GetBucketVersioning",
        "ce:GetCostAndUsage",
        "ce:GetCostForecast"
      ],
      "Resource": "*"
    }
  ]
}
```

### 2.2 AWS Sync Service (`services/aws_sync.py`)

**Initialization:**

```python
import boto3
from app.models.credential import Credential

class AWSSync:
    def __init__(self, credentials: Credential):
        self.ec2_client = boto3.client(
            'ec2',
            aws_access_key_id=decrypt_credential(credentials.access_key),
            aws_secret_access_key=decrypt_credential(credentials.secret_key),
            region_name=credentials.region or 'us-east-1'
        )

        self.s3_client = boto3.client(
            's3',
            aws_access_key_id=decrypt_credential(credentials.access_key),
            aws_secret_access_key=decrypt_credential(credentials.secret_key)
        )

        self.cost_client = boto3.client(
            'ce',  # Cost Explorer
            aws_access_key_id=decrypt_credential(credentials.access_key),
            aws_secret_access_key=decrypt_credential(credentials.secret_key),
            region_name='us-east-1'  # Cost Explorer only in us-east-1
        )
```

**EC2 Instance Sync:**

```python
def sync_ec2_instances(self, db: Session, user_id: int):
    """Fetch all EC2 instances"""
    response = self.ec2_client.describe_instances()

    resources = []
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            # Extract instance name from tags
            name = next(
                (tag['Value'] for tag in instance.get('Tags', []) if tag['Key'] == 'Name'),
                instance['InstanceId']
            )

            resource = ResourceInventory(
                user_id=user_id,
                resource_id=instance['InstanceId'],
                resource_name=name,
                resource_type='vm',
                provider='aws',
                region=instance['Placement']['AvailabilityZone'][:-1],  # Remove AZ letter
                status=instance['State']['Name'],
                metadata={
                    'instance_type': instance['InstanceType'],
                    'public_ip': instance.get('PublicIpAddress'),
                    'private_ip': instance.get('PrivateIpAddress'),
                    'vpc_id': instance.get('VpcId'),
                    'subnet_id': instance.get('SubnetId'),
                    'security_groups': [
                        {'id': sg['GroupId'], 'name': sg['GroupName']}
                        for sg in instance.get('SecurityGroups', [])
                    ],
                    'launch_time': instance['LaunchTime'].isoformat(),
                    'platform': instance.get('Platform', 'linux'),
                    'architecture': instance.get('Architecture'),
                    'tags': {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                }
            )

            # Upsert to database
            existing = db.query(ResourceInventory).filter_by(
                resource_id=resource.resource_id
            ).first()

            if existing:
                for key, value in resource.__dict__.items():
                    if not key.startswith('_'):
                        setattr(existing, key, value)
                existing.last_synced = datetime.utcnow()
            else:
                db.add(resource)

            resources.append(resource)

    db.commit()
    return resources
```

**S3 Bucket Sync:**

```python
def sync_s3_buckets(self, db: Session, user_id: int):
    """Fetch all S3 buckets"""
    response = self.s3_client.list_buckets()

    for bucket in response['Buckets']:
        # Get bucket location
        try:
            location_response = self.s3_client.get_bucket_location(
                Bucket=bucket['Name']
            )
            region = location_response['LocationConstraint'] or 'us-east-1'
        except:
            region = 'us-east-1'

        # Get bucket size (optional, can be expensive)
        # size = self._get_bucket_size(bucket['Name'])

        resource = ResourceInventory(
            user_id=user_id,
            resource_id=f"s3-{bucket['Name']}",
            resource_name=bucket['Name'],
            resource_type='storage',
            provider='aws',
            region=region,
            status='active',
            metadata={
                'bucket_type': 's3',
                'creation_date': bucket['CreationDate'].isoformat(),
                'storage_class': 'STANDARD',  # Default
                # 'size_bytes': size,
            }
        )

        # Upsert logic...
        db.add(resource)

    db.commit()
```

**VPC Sync:**

```python
def sync_vpcs(self, db: Session, user_id: int):
    """Fetch all VPCs"""
    response = self.ec2_client.describe_vpcs()

    for vpc in response['Vpcs']:
        name = next(
            (tag['Value'] for tag in vpc.get('Tags', []) if tag['Key'] == 'Name'),
            vpc['VpcId']
        )

        # Get subnets
        subnets_response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc['VpcId']]}]
        )

        resource = ResourceInventory(
            user_id=user_id,
            resource_id=vpc['VpcId'],
            resource_name=name,
            resource_type='network',
            provider='aws',
            region=self.ec2_client.meta.region_name,
            status='available',
            metadata={
                'cidr_block': vpc['CidrBlock'],
                'is_default': vpc['IsDefault'],
                'subnets': [
                    {
                        'id': subnet['SubnetId'],
                        'cidr': subnet['CidrBlock'],
                        'az': subnet['AvailabilityZone']
                    }
                    for subnet in subnets_response['Subnets']
                ],
                'tags': {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
            }
        )

        db.add(resource)

    db.commit()
```

**Cost Data Sync:**

```python
def sync_cost_data(self, db: Session, user_id: int):
    """Fetch cost data from Cost Explorer"""
    from datetime import datetime, timedelta

    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)

    response = self.cost_client.get_cost_and_usage(
        TimePeriod={
            'Start': start_date.strftime('%Y-%m-%d'),
            'End': end_date.strftime('%Y-%m-%d')
        },
        Granularity='DAILY',
        Metrics=['UnblendedCost'],
        GroupBy=[
            {'Type': 'DIMENSION', 'Key': 'SERVICE'},
        ]
    )

    for result in response['ResultsByTime']:
        date = datetime.strptime(result['TimePeriod']['Start'], '%Y-%m-%d').date()

        for group in result['Groups']:
            service = group['Keys'][0]
            cost = float(group['Metrics']['UnblendedCost']['Amount'])

            if cost > 0:
                cost_data = CostData(
                    user_id=user_id,
                    provider='aws',
                    service=service,
                    cost=cost,
                    currency='USD',
                    date=date,
                    billing_period=date.strftime('%Y-%m')
                )

                db.add(cost_data)

    db.commit()
```

---

## 3. Azure Integration

### 3.1 Required Credentials

**Service Principal:**

- Tenant ID
- Client ID (Application ID)
- Client Secret
- Subscription ID

**Creating Service Principal:**

```bash
# Login to Azure
az login

# Create service principal
az ad sp create-for-rbac --name "multi-cloud-platform" --role Reader

# Output:
{
  "appId": "12345678-1234-1234-1234-123456789012",
  "displayName": "multi-cloud-platform",
  "password": "your-client-secret",
  "tenant": "87654321-4321-4321-4321-210987654321"
}

# Get subscription ID
az account show --query id -o tsv
```

### 3.2 Azure Sync Service (`services/azure_sync.py`)

**Initialization:**

```python
from azure.identity import ClientSecretCredential
from azure.mgmt.compute import ComputeManagementClient
from azure.mgmt.storage import StorageManagementClient
from azure.mgmt.resource import ResourceManagementClient
from azure.mgmt.costmanagement import CostManagementClient

class AzureSync:
    def __init__(self, credentials: Credential):
        credential = ClientSecretCredential(
            tenant_id=decrypt_credential(credentials.tenant_id),
            client_id=decrypt_credential(credentials.client_id),
            client_secret=decrypt_credential(credentials.client_secret)
        )

        subscription_id = decrypt_credential(credentials.subscription_id)

        self.compute_client = ComputeManagementClient(credential, subscription_id)
        self.storage_client = StorageManagementClient(credential, subscription_id)
        self.resource_client = ResourceManagementClient(credential, subscription_id)
        self.cost_client = CostManagementClient(credential)
```

**Virtual Machine Sync:**

```python
def sync_virtual_machines(self, db: Session, user_id: int):
    """Fetch all Azure VMs"""
    vms = self.compute_client.virtual_machines.list_all()

    resources = []
    for vm in vms:
        # Get instance view for status
        instance_view = self.compute_client.virtual_machines.instance_view(
            resource_group_name=vm.id.split('/')[4],
            vm_name=vm.name
        )

        status = 'unknown'
        for status_obj in instance_view.statuses:
            if status_obj.code.startswith('PowerState/'):
                status = status_obj.code.split('/')[1]
                break

        resource = ResourceInventory(
            user_id=user_id,
            resource_id=vm.id,
            resource_name=vm.name,
            resource_type='vm',
            provider='azure',
            region=vm.location,
            status=status,
            metadata={
                'vm_size': vm.hardware_profile.vm_size,
                'os_type': vm.storage_profile.os_disk.os_type,
                'resource_group': vm.id.split('/')[4],
                'tags': vm.tags or {}
            }
        )

        # Upsert...
        db.add(resource)
        resources.append(resource)

    db.commit()
    return resources
```

**Storage Account Sync:**

```python
def sync_storage_accounts(self, db: Session, user_id: int):
    """Fetch all Azure Storage Accounts"""
    storage_accounts = self.storage_client.storage_accounts.list()

    for account in storage_accounts:
        resource = ResourceInventory(
            user_id=user_id,
            resource_id=account.id,
            resource_name=account.name,
            resource_type='storage',
            provider='azure',
            region=account.location,
            status='active',
            metadata={
                'account_type': account.sku.name,
                'kind': account.kind,
                'resource_group': account.id.split('/')[4],
                'tags': account.tags or {}
            }
        )

        db.add(resource)

    db.commit()
```

---

## 3. GCP Integration

### 3.1 Required Credentials

**Service Account:**

- Service Account JSON key file
- Project ID

**Creating Service Account:**

```bash
# Create service account
gcloud iam service-accounts create multi-cloud-platform \
    --display-name="Multi-Cloud Platform"

# Grant permissions
gcloud projects add-iam-policy-binding PROJECT_ID \
    --member="serviceAccount:multi-cloud-platform@PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/viewer"

# Create key
gcloud iam service-accounts keys create key.json \
    --iam-account=multi-cloud-platform@PROJECT_ID.iam.gserviceaccount.com
```

### 3.2 GCP Sync Service (`services/gcp_sync.py`)

**Initialization:**

```python
from google.oauth2 import service_account
from googleapiclient import discovery
import json

class GCPSync:
    def __init__(self, credentials: Credential):
        sa_json = json.loads(decrypt_credential(credentials.service_account_json))

        creds = service_account.Credentials.from_service_account_info(sa_json)

        self.compute = discovery.build('compute', 'v1', credentials=creds)
        self.storage = discovery.build('storage', 'v1', credentials=creds)
        self.project_id = credentials.project_id
```

**Compute Instance Sync:**

```python
def sync_compute_instances(self, db: Session, user_id: int):
    """Fetch all GCP Compute Engine instances"""
    request = self.compute.instances().aggregatedList(project=self.project_id)

    resources = []
    while request is not None:
        response = request.execute()

        for zone, instances_scoped_list in response['items'].items():
            if 'instances' in instances_scoped_list:
                for instance in instances_scoped_list['instances']:
                    resource = ResourceInventory(
                        user_id=user_id,
                        resource_id=instance['id'],
                        resource_name=instance['name'],
                        resource_type='vm',
                        provider='gcp',
                        region=zone.split('/')[-1][:-2],  # Remove zone letter
                        status=instance['status'].lower(),
                        metadata={
                            'machine_type': instance['machineType'].split('/')[-1],
                            'zone': zone.split('/')[-1],
                            'labels': instance.get('labels', {})
                        }
                    )

                    db.add(resource)
                    resources.append(resource)

        request = self.compute.instances().aggregatedList_next(
            previous_request=request,
            previous_response=response
        )

    db.commit()
    return resources
```

---

## 5. Credential Management

### 5.1 Adding Credentials via API

**AWS:**

```bash
curl -X POST http://localhost:8000/credentials/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "aws",
    "name": "AWS Production",
    "access_key": "AKIAIOSFODNN7EXAMPLE",
    "secret_key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
    "region": "us-east-1"
  }'
```

**Azure:**

```bash
curl -X POST http://localhost:8000/credentials/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "azure",
    "name": "Azure Main",
    "tenant_id": "12345678-1234-1234-1234-123456789012",
    "client_id": "87654321-4321-4321-4321-210987654321",
    "client_secret": "your-client-secret",
    "subscription_id": "abcdefgh-abcd-abcd-abcd-abcdefghijkl"
  }'
```

**GCP:**

```bash
curl -X POST http://localhost:8000/credentials/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "gcp",
    "name": "GCP Main",
    "service_account_json": "{\"type\":\"service_account\",...}",
    "project_id": "my-gcp-project-123456"
  }'
```

---

## 6. Resource Synchronization

### 6.1 Sync Flow

```
User adds credentials
        ↓
Credentials encrypted and stored
        ↓
Celery Beat triggers sync (every 10 min)
        ↓
sync_all_users_resources() task
        ↓
For each user with credentials:
    sync_user_resources(user_id)
        ↓
    For each credential:
        if AWS: sync_aws_resources()
        if Azure: sync_azure_resources()
        if GCP: sync_gcp_resources()
            ↓
        Fetch resources from cloud API
            ↓
        Transform to ResourceInventory model
            ↓
        Upsert to database
            ↓
        Update provider health status
```

### 6.2 Manual Sync Trigger

```bash
# Via API
curl -X POST http://localhost:8000/dashboard/sync/trigger \
  -H "Authorization: Bearer $TOKEN"

# Response
{
  "message": "Sync triggered successfully",
  "task_id": "abc123-def456"
}
```

---

## 7. Cost Data Integration

### 7.1 AWS Cost Explorer

```python
# Get last 30 days of costs
response = cost_client.get_cost_and_usage(
    TimePeriod={
        'Start': '2024-01-15',
        'End': '2024-02-15'
    },
    Granularity='DAILY',
    Metrics=['UnblendedCost'],
    GroupBy=[
        {'Type': 'DIMENSION', 'Key': 'SERVICE'}
    ]
)
```

### 7.2 Azure Cost Management

```python
# Get costs for subscription
scope = f"/subscriptions/{subscription_id}"

query = {
    "type": "Usage",
    "timeframe": "MonthToDate",
    "dataset": {
        "granularity": "Daily",
        "aggregation": {
            "totalCost": {
                "name": "PreTaxCost",
                "function": "Sum"
            }
        },
        "grouping": [
            {
                "type": "Dimension",
                "name": "ServiceName"
            }
        ]
    }
}

result = cost_client.query.usage(scope, query)
```

### 7.3 GCP Billing

```python
# Use BigQuery export for billing data
from google.cloud import bigquery

client = bigquery.Client(project=project_id)

query = """
SELECT
    service.description AS service,
    SUM(cost) AS total_cost,
    DATE(usage_start_time) AS date
FROM
    `project.dataset.gcp_billing_export_v1_XXXXXX`
WHERE
    DATE(usage_start_time) >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
GROUP BY
    service, date
ORDER BY
    date DESC
"""

results = client.query(query)
```

---

## Summary

The platform provides **comprehensive cloud provider integration** with:

- ✅ AWS, Azure, and GCP support
- ✅ Automatic resource discovery
- ✅ Real-time synchronization every 10 minutes
- ✅ Cost data retrieval
- ✅ Provider health monitoring
- ✅ Secure credential storage (AES-256 encryption)
- ✅ Manual sync triggers

**Next:** See [TERRAFORM.md](./TERRAFORM.md) for infrastructure provisioning documentation.
