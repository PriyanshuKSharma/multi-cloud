"""
AWS Resource Synchronization Service
Fetches real-time resource inventory from AWS using boto3
"""
import boto3
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import logging

logger = logging.getLogger(__name__)


class AWSResourceSync:
    """Real-time AWS resource inventory sync"""
    
    def __init__(self, credentials: dict):
        """
        Initialize AWS clients with credentials
        
        Args:
            credentials: Dict with 'access_key', 'secret_key', 'region'
        """
        self.region = credentials.get('region', 'us-east-1')
        
        try:
            self.ec2 = boto3.client(
                'ec2',
                aws_access_key_id=credentials['access_key'],
                aws_secret_access_key=credentials['secret_key'],
                region_name=self.region
            )
            
            self.s3 = boto3.client(
                's3',
                aws_access_key_id=credentials['access_key'],
                aws_secret_access_key=credentials['secret_key'],
                region_name=self.region
            )
            
            # Cost Explorer (only available in us-east-1)
            self.ce = boto3.client(
                'ce',
                aws_access_key_id=credentials['access_key'],
                aws_secret_access_key=credentials['secret_key'],
                region_name='us-east-1'
            )
        except Exception as e:
            logger.error(f"Failed to initialize AWS clients: {e}")
            raise
    
    def _get_tag_value(self, resource: dict, tag_key: str) -> Optional[str]:
        """Extract tag value from AWS resource tags"""
        tags = resource.get('Tags', [])
        for tag in tags:
            if tag['Key'] == tag_key:
                return tag['Value']
        return None
    
    def sync_ec2_instances(self) -> List[dict]:
        """
        Fetch all EC2 instances
        
        Returns:
            List of instance dictionaries with standardized fields
        """
        try:
            response = self.ec2.describe_instances()
            instances = []
            
            for reservation in response['Reservations']:
                for instance in reservation['Instances']:
                    instances.append({
                        'resource_id': instance['InstanceId'],
                        'resource_name': self._get_tag_value(instance, 'Name') or instance['InstanceId'],
                        'resource_type': 'vm',
                        'status': instance['State']['Name'],
                        'region': instance['Placement']['AvailabilityZone'][:-1],  # Remove zone suffix
                        'instance_type': instance['InstanceType'],
                        'public_ip': instance.get('PublicIpAddress'),
                        'private_ip': instance.get('PrivateIpAddress'),
                        'resource_metadata': {
                            'ami_id': instance['ImageId'],
                            'launch_time': instance['LaunchTime'].isoformat(),
                            'vpc_id': instance.get('VpcId'),
                            'subnet_id': instance.get('SubnetId'),
                            'availability_zone': instance['Placement']['AvailabilityZone'],
                            'platform': instance.get('Platform', 'linux'),
                        },
                        'tags': {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                    })
            
            logger.info(f"Synced {len(instances)} EC2 instances from AWS")
            return instances
            
        except Exception as e:
            logger.error(f"Error syncing EC2 instances: {e}")
            return []
    
    def sync_s3_buckets(self) -> List[dict]:
        """
        Fetch all S3 buckets
        
        Returns:
            List of bucket dictionaries with standardized fields
        """
        try:
            response = self.s3.list_buckets()
            buckets = []
            
            for bucket in response['Buckets']:
                bucket_name = bucket['Name']
                
                try:
                    # Get bucket location
                    location_response = self.s3.get_bucket_location(Bucket=bucket_name)
                    region = location_response['LocationConstraint'] or 'us-east-1'
                    
                    # Get bucket size (approximate - would need CloudWatch for accurate data)
                    # For now, we'll mark it as 0 and update via CloudWatch in a future enhancement
                    
                    buckets.append({
                        'resource_id': bucket_name,
                        'resource_name': bucket_name,
                        'resource_type': 'storage',
                        'status': 'active',
                        'region': region,
                        'resource_metadata': {
                            'creation_date': bucket['CreationDate'].isoformat(),
                            'bucket_type': 's3',
                        },
                        'tags': {}  # Would need separate API call to get bucket tags
                    })
                except Exception as bucket_error:
                    logger.warning(f"Could not get details for bucket {bucket_name}: {bucket_error}")
                    continue
            
            logger.info(f"Synced {len(buckets)} S3 buckets from AWS")
            return buckets
            
        except Exception as e:
            logger.error(f"Error syncing S3 buckets: {e}")
            return []
    
    def sync_vpcs(self) -> List[dict]:
        """
        Fetch all VPCs
        
        Returns:
            List of VPC dictionaries
        """
        try:
            response = self.ec2.describe_vpcs()
            vpcs = []
            
            for vpc in response['Vpcs']:
                vpcs.append({
                    'resource_id': vpc['VpcId'],
                    'resource_name': self._get_tag_value(vpc, 'Name') or vpc['VpcId'],
                    'resource_type': 'vpc',
                    'status': vpc['State'],
                    'region': self.region,
                    'resource_metadata': {
                        'cidr_block': vpc['CidrBlock'],
                        'is_default': vpc['IsDefault'],
                    },
                    'tags': {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
                })
            
            logger.info(f"Synced {len(vpcs)} VPCs from AWS")
            return vpcs
            
        except Exception as e:
            logger.error(f"Error syncing VPCs: {e}")
            return []
    
    def get_cost_data(self, start_date: str, end_date: str) -> Dict:
        """
        Fetch cost data from AWS Cost Explorer
        
        Args:
            start_date: Start date in YYYY-MM-DD format
            end_date: End date in YYYY-MM-DD format
            
        Returns:
            Dict with cost breakdown by service
        """
        try:
            response = self.ce.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date,
                    'End': end_date
                },
                Granularity='MONTHLY',
                Metrics=['UnblendedCost'],
                GroupBy=[
                    {'Type': 'DIMENSION', 'Key': 'SERVICE'},
                ]
            )
            
            cost_data = []
            for result in response['ResultsByTime']:
                period_start = result['TimePeriod']['Start']
                period_end = result['TimePeriod']['End']
                
                for group in result['Groups']:
                    service_name = group['Keys'][0]
                    cost_amount = float(group['Metrics']['UnblendedCost']['Amount'])
                    
                    if cost_amount > 0:  # Only include services with actual costs
                        cost_data.append({
                            'service_name': service_name,
                            'cost_amount': cost_amount,
                            'currency': group['Metrics']['UnblendedCost']['Unit'],
                            'period_start': period_start,
                            'period_end': period_end,
                        })
            
            logger.info(f"Fetched cost data for {len(cost_data)} AWS services")
            return {
                'total_cost': sum(item['cost_amount'] for item in cost_data),
                'breakdown': cost_data
            }
            
        except Exception as e:
            logger.error(f"Error fetching AWS cost data: {e}")
            return {'total_cost': 0, 'breakdown': []}
    
    def check_health(self) -> Dict:
        """
        Check AWS API connectivity and response time
        
        Returns:
            Dict with status, response_time_ms, error_message
        """
        start_time = datetime.now()
        
        try:
            # Simple API call to check connectivity
            self.ec2.describe_regions()
            
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
