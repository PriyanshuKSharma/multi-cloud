"""
Background Synchronization Tasks
Celery periodic tasks to sync resources from cloud providers
"""
from celery import shared_task
from celery.schedules import crontab
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.models.credential import CloudCredential
from app.models.resource_inventory import ResourceInventory, ProviderHealth
from app.services.aws_sync import AWSResourceSync
from app.services.azure_sync import AzureResourceSync
from app.services.gcp_sync import GCPResourceSync
from app.core.security import decrypt_data
from datetime import datetime
import json
import logging

logger = logging.getLogger(__name__)


@shared_task(name="sync_all_users_resources")
def sync_all_users_resources():
    """
    Sync resources for all users
    This is the main periodic task that runs every 10 minutes
    """
    db = SessionLocal()
    try:
        # Get all unique user IDs with credentials
        user_ids = db.query(CloudCredential.user_id).distinct().all()
        
        for (user_id,) in user_ids:
            logger.info(f"Triggering sync for user {user_id}")
            sync_user_resources.delay(user_id)
        
        logger.info(f"Triggered sync for {len(user_ids)} users")
    except Exception as e:
        logger.error(f"Error in sync_all_users_resources: {e}")
    finally:
        db.close()


@shared_task(name="sync_user_resources")
def sync_user_resources(user_id: int):
    """
    Sync resources for a specific user across all their cloud providers
    
    Args:
        user_id: User ID to sync resources for
    """
    db = SessionLocal()
    try:
        credentials = db.query(CloudCredential).filter(
            CloudCredential.user_id == user_id
        ).all()
        
        for cred in credentials:
            logger.info(f"Syncing {cred.provider} resources for user {user_id}")
            
            if cred.provider == 'aws':
                sync_aws_resources.delay(cred.id, user_id)
            elif cred.provider == 'azure':
                sync_azure_resources.delay(cred.id, user_id)
            elif cred.provider == 'gcp':
                sync_gcp_resources.delay(cred.id, user_id)
    except Exception as e:
        logger.error(f"Error syncing user {user_id} resources: {e}")
    finally:
        db.close()


@shared_task(name="sync_aws_resources")
def sync_aws_resources(credential_id: int, user_id: int):
    """
    Sync AWS resources for a specific credential
    
    Args:
        credential_id: CloudCredential ID
        user_id: User ID
    """
    db = SessionLocal()
    try:
        cred = db.query(CloudCredential).filter(CloudCredential.id == credential_id).first()
        if not cred:
            logger.error(f"Credential {credential_id} not found")
            return
        
        # Decrypt credentials
        cred_data = json.loads(decrypt_data(cred.encrypted_data))
        
        # Initialize AWS sync
        aws_sync = AWSResourceSync({
            'access_key': cred_data['access_key'],
            'secret_key': cred_data['secret_key'],
            'region': cred_data.get('region', 'us-east-1')
        })
        
        # Check health first
        health = aws_sync.check_health()
        _upsert_provider_health(db, user_id, 'aws', credential_id, health)
        
        if health['status'] == 'error':
            logger.error(f"AWS health check failed for credential {credential_id}: {health['error_message']}")
            db.commit()
            return
        
        # Sync EC2 instances
        instances = aws_sync.sync_ec2_instances()
        for instance in instances:
            _upsert_resource_inventory(db, user_id, 'aws', instance)
        
        # Sync S3 buckets
        buckets = aws_sync.sync_s3_buckets()
        for bucket in buckets:
            _upsert_resource_inventory(db, user_id, 'aws', bucket)
        
        # Sync VPCs
        vpcs = aws_sync.sync_vpcs()
        for vpc in vpcs:
            _upsert_resource_inventory(db, user_id, 'aws', vpc)
        
        db.commit()
        logger.info(f"Successfully synced AWS resources for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error syncing AWS resources: {e}")
        db.rollback()
    finally:
        db.close()


@shared_task(name="sync_azure_resources")
def sync_azure_resources(credential_id: int, user_id: int):
    """
    Sync Azure resources for a specific credential
    
    Args:
        credential_id: CloudCredential ID
        user_id: User ID
    """
    db = SessionLocal()
    try:
        cred = db.query(CloudCredential).filter(CloudCredential.id == credential_id).first()
        if not cred:
            logger.error(f"Credential {credential_id} not found")
            return
        
        # Decrypt credentials
        cred_data = json.loads(decrypt_data(cred.encrypted_data))
        
        # Initialize Azure sync
        azure_sync = AzureResourceSync({
            'tenant_id': cred_data['tenant_id'],
            'client_id': cred_data['client_id'],
            'client_secret': cred_data['client_secret'],
            'subscription_id': cred_data['subscription_id']
        })
        
        # Check health first
        health = azure_sync.check_health()
        _upsert_provider_health(db, user_id, 'azure', credential_id, health)
        
        if health['status'] == 'error':
            logger.error(f"Azure health check failed for credential {credential_id}: {health['error_message']}")
            db.commit()
            return
        
        # Sync VMs
        vms = azure_sync.sync_vms()
        for vm in vms:
            _upsert_resource_inventory(db, user_id, 'azure', vm)
        
        # Sync storage accounts
        storage_accounts = azure_sync.sync_storage_accounts()
        for account in storage_accounts:
            _upsert_resource_inventory(db, user_id, 'azure', account)
        
        # Sync resource groups
        resource_groups = azure_sync.sync_resource_groups()
        for rg in resource_groups:
            _upsert_resource_inventory(db, user_id, 'azure', rg)
        
        db.commit()
        logger.info(f"Successfully synced Azure resources for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error syncing Azure resources: {e}")
        db.rollback()
    finally:
        db.close()


@shared_task(name="sync_gcp_resources")
def sync_gcp_resources(credential_id: int, user_id: int):
    """
    Sync GCP resources for a specific credential
    
    Args:
        credential_id: CloudCredential ID
        user_id: User ID
    """
    db = SessionLocal()
    try:
        cred = db.query(CloudCredential).filter(CloudCredential.id == credential_id).first()
        if not cred:
            logger.error(f"Credential {credential_id} not found")
            return
        
        # Decrypt credentials
        cred_data = json.loads(decrypt_data(cred.encrypted_data))
        
        # Initialize GCP sync
        gcp_sync = GCPResourceSync(cred_data)
        
        # Check health first
        health = gcp_sync.check_health()
        _upsert_provider_health(db, user_id, 'gcp', credential_id, health)
        
        if health['status'] == 'error':
            logger.error(f"GCP health check failed for credential {credential_id}: {health['error_message']}")
            db.commit()
            return
        
        # Sync Compute Engine instances
        instances = gcp_sync.sync_compute_instances()
        for instance in instances:
            _upsert_resource_inventory(db, user_id, 'gcp', instance)
        
        # Sync Cloud Storage buckets
        buckets = gcp_sync.sync_storage_buckets()
        for bucket in buckets:
            _upsert_resource_inventory(db, user_id, 'gcp', bucket)
        
        # Sync VPC networks
        networks = gcp_sync.sync_networks()
        for network in networks:
            _upsert_resource_inventory(db, user_id, 'gcp', network)
        
        db.commit()
        logger.info(f"Successfully synced GCP resources for user {user_id}")
        
    except Exception as e:
        logger.error(f"Error syncing GCP resources: {e}")
        db.rollback()
    finally:
        db.close()


def _upsert_resource_inventory(db: Session, user_id: int, provider: str, resource_data: dict):
    """
    Insert or update resource in inventory
    
    Args:
        db: Database session
        user_id: User ID
        provider: Cloud provider
        resource_data: Resource data dictionary
    """
    existing = db.query(ResourceInventory).filter(
        ResourceInventory.user_id == user_id,
        ResourceInventory.provider == provider,
        ResourceInventory.resource_id == resource_data['resource_id']
    ).first()
    
    if existing:
        # Update existing resource
        for key, value in resource_data.items():
            if hasattr(existing, key):
                setattr(existing, key, value)
        existing.last_synced_at = datetime.utcnow()
    else:
        # Create new resource
        inventory = ResourceInventory(
            user_id=user_id,
            provider=provider,
            **resource_data
        )
        db.add(inventory)


def _upsert_provider_health(db: Session, user_id: int, provider: str, 
                            credential_id: int, health_data: dict):
    """
    Insert or update provider health status
    
    Args:
        db: Database session
        user_id: User ID
        provider: Cloud provider
        credential_id: Credential ID
        health_data: Health check data
    """
    existing = db.query(ProviderHealth).filter(
        ProviderHealth.user_id == user_id,
        ProviderHealth.provider == provider,
        ProviderHealth.credential_id == credential_id
    ).first()
    
    if existing:
        existing.status = health_data['status']
        existing.response_time_ms = health_data['response_time_ms']
        existing.error_message = health_data['error_message']
        existing.last_check_at = datetime.utcnow()
    else:
        health = ProviderHealth(
            user_id=user_id,
            provider=provider,
            credential_id=credential_id,
            status=health_data['status'],
            response_time_ms=health_data['response_time_ms'],
            error_message=health_data['error_message']
        )
        db.add(health)


# Configure Celery Beat schedule
def setup_periodic_tasks(sender, **kwargs):
    """
    Configure periodic tasks for Celery Beat
    This should be called in worker.py
    """
    from celery.schedules import crontab
    
    sender.add_periodic_task(
        crontab(minute='*/10'),  # Every 10 minutes
        sync_all_users_resources.s(),
        name='sync-all-resources-every-10-minutes'
    )
