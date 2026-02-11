# Celery & Background Jobs Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Configuration](#3-configuration)
4. [Tasks](#4-tasks)
5. [Periodic Tasks](#5-periodic-tasks)
6. [Monitoring](#6-monitoring)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Overview

**Celery** is a distributed task queue system used for:

- Background resource synchronization from cloud providers
- Terraform deployment execution
- Scheduled periodic tasks
- Asynchronous job processing

**Components:**

- **Celery Worker** - Executes tasks
- **Celery Beat** - Scheduler for periodic tasks
- **Redis** - Message broker and result backend

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CELERY BEAT                              │
│                   (Scheduler)                               │
│                                                             │
│  Periodic Tasks:                                            │
│  • sync_all_users_resources() - Every 10 minutes            │
│  • cleanup_old_logs() - Daily at midnight                   │
│  • update_provider_health() - Every 5 minutes               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Enqueue tasks to Redis
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                       REDIS                                 │
│                  (Message Broker)                           │
│                                                             │
│  Queues:                                                    │
│  • celery (default queue)                                   │
│  • celery:sync (resource sync tasks)                        │
│  • celery:terraform (terraform tasks)                       │
│  • celery:results (task results)                            │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Workers dequeue tasks
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  CELERY WORKERS                             │
│                                                             │
│  Worker Pool (4 workers):                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Worker 1    │  │  Worker 2    │  │  Worker 3    │     │
│  │              │  │              │  │              │     │
│  │ Executing:   │  │ Executing:   │  │ Idle         │     │
│  │ AWS Sync     │  │ Azure Sync   │  │              │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  Tasks:                                                     │
│  • sync_aws_resources()                                     │
│  • sync_azure_resources()                                   │
│  • sync_gcp_resources()                                     │
│  • provision_resource_task()                                │
│  • destroy_resource_task()                                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ Read/Write data
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    POSTGRESQL                               │
│                                                             │
│  • resource_inventory (updated by sync tasks)               │
│  • cost_data (updated by cost sync)                         │
│  • provider_health (updated by health checks)               │
│  • resources (updated by terraform tasks)                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Configuration

### 3.1 Celery App Configuration (`core/celery_app.py`)

```python
from celery import Celery
from celery.schedules import crontab
import os

celery_app = Celery(
    'multi_cloud',
    broker=os.getenv('CELERY_BROKER_URL', 'redis://redis:6379/0'),
    backend=os.getenv('CELERY_RESULT_BACKEND', 'redis://redis:6379/0'),
    include=['app.tasks.sync_tasks', 'app.tasks.terraform_tasks']
)

# Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,

    # Task execution settings
    task_acks_late=True,  # Acknowledge task after execution
    task_reject_on_worker_lost=True,
    worker_prefetch_multiplier=1,  # One task at a time per worker

    # Result backend settings
    result_expires=3600,  # Results expire after 1 hour
    result_backend_transport_options={
        'master_name': 'mymaster',
    },

    # Task routing
    task_routes={
        'app.tasks.sync_tasks.*': {'queue': 'sync'},
        'app.tasks.terraform_tasks.*': {'queue': 'terraform'},
    },

    # Beat schedule (periodic tasks)
    beat_schedule={
        'sync-all-users-every-10-minutes': {
            'task': 'app.tasks.sync_tasks.sync_all_users_resources',
            'schedule': crontab(minute='*/10'),  # Every 10 minutes
        },
        'update-provider-health-every-5-minutes': {
            'task': 'app.tasks.sync_tasks.update_all_provider_health',
            'schedule': crontab(minute='*/5'),  # Every 5 minutes
        },
        'cleanup-old-logs-daily': {
            'task': 'app.tasks.sync_tasks.cleanup_old_logs',
            'schedule': crontab(hour=0, minute=0),  # Daily at midnight
        },
    },
)
```

### 3.2 Worker Configuration (`worker.py`)

```python
from app.core.celery_app import celery_app
from app.models import user, resource, credential, resource_inventory

# Import tasks so Celery can find them
from app.tasks.sync_tasks import (
    sync_all_users_resources,
    sync_user_resources,
    sync_aws_resources,
    sync_azure_resources,
    sync_gcp_resources,
    update_all_provider_health,
)
from app.tasks.terraform_tasks import (
    provision_resource_task,
    destroy_resource_task,
)

# Configure periodic tasks
from celery.signals import beat_init

@beat_init.connect
def configure_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks when Beat starts"""
    print("Celery Beat initialized with periodic tasks")
```

---

## 4. Tasks

### 4.1 Sync Tasks (`tasks/sync_tasks.py`)

#### sync_all_users_resources

```python
@shared_task(name='app.tasks.sync_tasks.sync_all_users_resources')
def sync_all_users_resources():
    """
    Sync resources for all users with active credentials.
    Triggered every 10 minutes by Celery Beat.
    """
    from app.db.base import SessionLocal
    from app.models.user import User
    from app.models.credential import Credential

    db = SessionLocal()
    try:
        # Get all users with credentials
        users_with_creds = db.query(User).join(Credential).distinct().all()

        logger.info(f"Starting sync for {len(users_with_creds)} users")

        for user in users_with_creds:
            # Enqueue individual user sync
            sync_user_resources.delay(user.id)

        logger.info(f"Enqueued sync tasks for {len(users_with_creds)} users")

    finally:
        db.close()
```

#### sync_user_resources

```python
@shared_task(name='app.tasks.sync_tasks.sync_user_resources')
def sync_user_resources(user_id: int):
    """
    Sync all cloud resources for a specific user.
    Calls provider-specific sync tasks.
    """
    from app.db.base import SessionLocal
    from app.models.credential import Credential

    db = SessionLocal()
    try:
        # Get user's credentials
        credentials = db.query(Credential).filter_by(
            user_id=user_id,
            is_active=True
        ).all()

        logger.info(f"Syncing resources for user {user_id} with {len(credentials)} credentials")

        for cred in credentials:
            if cred.provider == 'aws':
                sync_aws_resources.delay(user_id, cred.id)
            elif cred.provider == 'azure':
                sync_azure_resources.delay(user_id, cred.id)
            elif cred.provider == 'gcp':
                sync_gcp_resources.delay(user_id, cred.id)

    finally:
        db.close()
```

#### sync_aws_resources

```python
@shared_task(
    name='app.tasks.sync_tasks.sync_aws_resources',
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def sync_aws_resources(self, user_id: int, credential_id: int):
    """
    Sync AWS resources (EC2, S3, VPC, Cost data).
    Retries up to 3 times on failure.
    """
    from app.db.base import SessionLocal
    from app.models.credential import Credential
    from app.services.aws_sync import AWSSync

    db = SessionLocal()
    try:
        # Get credentials
        cred = db.query(Credential).filter_by(id=credential_id).first()
        if not cred:
            logger.error(f"Credential {credential_id} not found")
            return

        logger.info(f"Syncing AWS resources for user {user_id}")

        # Initialize AWS sync service
        aws_sync = AWSSync(cred)

        # Sync EC2 instances
        instances = aws_sync.sync_ec2_instances(db, user_id)
        logger.info(f"Synced {len(instances)} EC2 instances")

        # Sync S3 buckets
        buckets = aws_sync.sync_s3_buckets(db, user_id)
        logger.info(f"Synced {len(buckets)} S3 buckets")

        # Sync VPCs
        vpcs = aws_sync.sync_vpcs(db, user_id)
        logger.info(f"Synced {len(vpcs)} VPCs")

        # Sync cost data
        aws_sync.sync_cost_data(db, user_id)
        logger.info(f"Synced cost data for user {user_id}")

        # Update provider health
        aws_sync.update_health_status(db, user_id, 'healthy')

        logger.info(f"Successfully synced AWS resources for user {user_id}")

    except Exception as exc:
        logger.error(f"Error syncing AWS resources: {exc}")

        # Update health status to error
        try:
            aws_sync.update_health_status(db, user_id, 'error', str(exc))
        except:
            pass

        # Retry task
        raise self.retry(exc=exc)

    finally:
        db.close()
```

#### sync_azure_resources

```python
@shared_task(
    name='app.tasks.sync_tasks.sync_azure_resources',
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def sync_azure_resources(self, user_id: int, credential_id: int):
    """Sync Azure resources (VMs, Storage, Resource Groups)"""
    from app.db.base import SessionLocal
    from app.models.credential import Credential
    from app.services.azure_sync import AzureSync

    db = SessionLocal()
    try:
        cred = db.query(Credential).filter_by(id=credential_id).first()
        if not cred:
            return

        logger.info(f"Syncing Azure resources for user {user_id}")

        azure_sync = AzureSync(cred)

        # Sync VMs
        vms = azure_sync.sync_virtual_machines(db, user_id)
        logger.info(f"Synced {len(vms)} Azure VMs")

        # Sync Storage Accounts
        storage = azure_sync.sync_storage_accounts(db, user_id)
        logger.info(f"Synced {len(storage)} storage accounts")

        # Sync Resource Groups
        rgs = azure_sync.sync_resource_groups(db, user_id)
        logger.info(f"Synced {len(rgs)} resource groups")

        azure_sync.update_health_status(db, user_id, 'healthy')

    except Exception as exc:
        logger.error(f"Error syncing Azure resources: {exc}")
        raise self.retry(exc=exc)

    finally:
        db.close()
```

#### sync_gcp_resources

```python
@shared_task(
    name='app.tasks.sync_tasks.sync_gcp_resources',
    bind=True,
    max_retries=3,
    default_retry_delay=60
)
def sync_gcp_resources(self, user_id: int, credential_id: int):
    """Sync GCP resources (Compute, Storage, Networks)"""
    from app.db.base import SessionLocal
    from app.models.credential import Credential
    from app.services.gcp_sync import GCPSync

    db = SessionLocal()
    try:
        cred = db.query(Credential).filter_by(id=credential_id).first()
        if not cred:
            return

        logger.info(f"Syncing GCP resources for user {user_id}")

        gcp_sync = GCPSync(cred)

        # Sync Compute Engine instances
        instances = gcp_sync.sync_compute_instances(db, user_id)
        logger.info(f"Synced {len(instances)} GCP instances")

        # Sync Cloud Storage buckets
        buckets = gcp_sync.sync_storage_buckets(db, user_id)
        logger.info(f"Synced {len(buckets)} GCP buckets")

        # Sync VPC networks
        networks = gcp_sync.sync_networks(db, user_id)
        logger.info(f"Synced {len(networks)} GCP networks")

        gcp_sync.update_health_status(db, user_id, 'healthy')

    except Exception as exc:
        logger.error(f"Error syncing GCP resources: {exc}")
        raise self.retry(exc=exc)

    finally:
        db.close()
```

### 4.2 Terraform Tasks (`tasks/terraform_tasks.py`)

#### provision_resource_task

```python
@shared_task(
    name='app.tasks.terraform_tasks.provision_resource_task',
    bind=True
)
def provision_resource_task(self, resource_id: int):
    """
    Execute Terraform to provision a resource.
    Updates resource status and logs in real-time.
    """
    from app.db.base import SessionLocal
    from app.models.resource import Resource
    from app.services.terraform_runner import TerraformRunner
    import tempfile
    import os

    db = SessionLocal()
    try:
        # Get resource
        resource = db.query(Resource).filter_by(id=resource_id).first()
        if not resource:
            logger.error(f"Resource {resource_id} not found")
            return

        # Update status
        resource.status = 'provisioning'
        db.commit()

        # Create temporary directory for Terraform files
        with tempfile.TemporaryDirectory() as tmpdir:
            # Generate Terraform configuration
            tf_config = generate_terraform_config(resource)

            # Write to file
            with open(os.path.join(tmpdir, 'main.tf'), 'w') as f:
                f.write(tf_config)

            # Initialize Terraform runner
            runner = TerraformRunner(tmpdir)

            # Run terraform init
            init_result = runner.init()
            logs = init_result['stdout']

            if not init_result['success']:
                resource.status = 'failed'
                resource.terraform_output = {'logs': logs, 'error': init_result['stderr']}
                db.commit()
                return

            # Run terraform plan
            plan_result = runner.plan()
            logs += "\n" + plan_result['stdout']

            if not plan_result['success']:
                resource.status = 'failed'
                resource.terraform_output = {'logs': logs, 'error': plan_result['stderr']}
                db.commit()
                return

            # Run terraform apply
            apply_result = runner.apply()
            logs += "\n" + apply_result['stdout']

            if apply_result['success']:
                resource.status = 'active'
                resource.terraform_output = {
                    'logs': logs,
                    'outputs': apply_result['outputs']
                }
            else:
                resource.status = 'failed'
                resource.terraform_output = {
                    'logs': logs,
                    'error': apply_result['stderr']
                }

            db.commit()

            logger.info(f"Resource {resource_id} provisioning completed with status: {resource.status}")

    except Exception as exc:
        logger.error(f"Error provisioning resource {resource_id}: {exc}")
        resource.status = 'failed'
        resource.terraform_output = {'error': str(exc)}
        db.commit()

    finally:
        db.close()
```

---

## 5. Periodic Tasks

### Schedule Configuration

```python
beat_schedule = {
    # Sync all users' resources every 10 minutes
    'sync-all-users-every-10-minutes': {
        'task': 'app.tasks.sync_tasks.sync_all_users_resources',
        'schedule': crontab(minute='*/10'),
    },

    # Update provider health every 5 minutes
    'update-provider-health-every-5-minutes': {
        'task': 'app.tasks.sync_tasks.update_all_provider_health',
        'schedule': crontab(minute='*/5'),
    },

    # Cleanup old logs daily at midnight
    'cleanup-old-logs-daily': {
        'task': 'app.tasks.sync_tasks.cleanup_old_logs',
        'schedule': crontab(hour=0, minute=0),
    },

    # Update cost data daily at 1 AM
    'update-cost-data-daily': {
        'task': 'app.tasks.sync_tasks.update_all_cost_data',
        'schedule': crontab(hour=1, minute=0),
    },
}
```

### Crontab Examples

```python
# Every minute
crontab()

# Every 5 minutes
crontab(minute='*/5')

# Every 10 minutes
crontab(minute='*/10')

# Every hour
crontab(minute=0)

# Every day at midnight
crontab(hour=0, minute=0)

# Every Monday at 9 AM
crontab(hour=9, minute=0, day_of_week=1)

# First day of month at midnight
crontab(hour=0, minute=0, day_of_month=1)
```

---

## 6. Monitoring

### 6.1 Flower (Celery Monitoring Tool)

**Installation:**

```bash
pip install flower
```

**Start Flower:**

```bash
celery -A app.worker flower --port=5555
```

**Access:** http://localhost:5555

**Features:**

- Real-time task monitoring
- Worker status
- Task history
- Task statistics
- Broker monitoring

### 6.2 Celery CLI Commands

**List active tasks:**

```bash
celery -A app.worker inspect active
```

**List registered tasks:**

```bash
celery -A app.worker inspect registered
```

**List scheduled tasks:**

```bash
celery -A app.worker inspect scheduled
```

**Worker stats:**

```bash
celery -A app.worker inspect stats
```

**Revoke a task:**

```bash
celery -A app.worker revoke <task_id>
```

**Purge all tasks:**

```bash
celery -A app.worker purge
```

### 6.3 Logging

**Configure logging in tasks:**

```python
import logging

logger = logging.getLogger(__name__)

@shared_task
def my_task():
    logger.info("Task started")
    logger.warning("Warning message")
    logger.error("Error occurred")
```

**View logs:**

```bash
# Docker logs
docker logs multi-cloud-celery_worker-1 -f

# Celery worker logs
celery -A app.worker worker --loglevel=info
```

---

## 7. Troubleshooting

### 7.1 Common Issues

**Issue: Tasks not executing**

**Solution:**

1. Check if worker is running:

   ```bash
   docker ps | grep celery_worker
   ```

2. Check worker logs:

   ```bash
   docker logs multi-cloud-celery_worker-1
   ```

3. Verify Redis connection:
   ```bash
   docker exec -it multi-cloud-redis-1 redis-cli ping
   ```

**Issue: Tasks stuck in pending**

**Solution:**

1. Check if Beat is running:

   ```bash
   docker ps | grep celery_beat
   ```

2. Restart workers:
   ```bash
   docker-compose restart celery_worker celery_beat
   ```

**Issue: Memory leaks**

**Solution:**

1. Set worker max tasks per child:

   ```python
   celery_app.conf.worker_max_tasks_per_child = 100
   ```

2. Monitor memory usage:
   ```bash
   docker stats multi-cloud-celery_worker-1
   ```

### 7.2 Debugging

**Enable debug logging:**

```bash
celery -A app.worker worker --loglevel=debug
```

**Test task manually:**

```python
from app.tasks.sync_tasks import sync_aws_resources

# Run synchronously
result = sync_aws_resources(user_id=1, credential_id=1)

# Run asynchronously
task = sync_aws_resources.delay(user_id=1, credential_id=1)
print(f"Task ID: {task.id}")
print(f"Status: {task.status}")
print(f"Result: {task.result}")
```

### 7.3 Performance Tuning

**Increase worker concurrency:**

```bash
celery -A app.worker worker --concurrency=8
```

**Use different pool types:**

```bash
# Prefork (default)
celery -A app.worker worker --pool=prefork

# Gevent (for I/O bound tasks)
celery -A app.worker worker --pool=gevent --concurrency=100

# Solo (single process, for debugging)
celery -A app.worker worker --pool=solo
```

**Configure task priorities:**

```python
@shared_task(priority=10)  # Higher priority
def important_task():
    pass

@shared_task(priority=1)  # Lower priority
def background_task():
    pass
```

---

## Summary

Celery provides **robust background task processing** for:

- ✅ Automatic resource synchronization every 10 minutes
- ✅ Terraform deployment execution
- ✅ Provider health monitoring
- ✅ Cost data updates
- ✅ Scalable task distribution
- ✅ Retry mechanisms for failed tasks
- ✅ Real-time monitoring with Flower

**Next:** See [CLOUD_PROVIDERS.md](./CLOUD_PROVIDERS.md) for cloud integration details.
