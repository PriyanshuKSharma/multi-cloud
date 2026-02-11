from app.core.celery_app import celery_app
from app.models import user, resource, credential # Register models

# Import tasks so Celery can find them
from app.tasks.terraform_tasks import provision_resource_task
from app.tasks.sync_tasks import (
    sync_all_users_resources,
    sync_user_resources,
    sync_aws_resources,
    sync_azure_resources,
    sync_gcp_resources,
    setup_periodic_tasks
)

# Configure periodic tasks
from celery.signals import beat_init

@beat_init.connect
def configure_periodic_tasks(sender, **kwargs):
    setup_periodic_tasks(sender)
