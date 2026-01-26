from app.core.celery_app import celery_app

# Import tasks so Celery can find them
from app.tasks.terraform_tasks import provision_resource_task
