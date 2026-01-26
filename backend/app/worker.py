from app.core.celery_app import celery_app
from app.models import user, resource, credential # Register models

# Import tasks so Celery can find them
from app.tasks.terraform_tasks import provision_resource_task
