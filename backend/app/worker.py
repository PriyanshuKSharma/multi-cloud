from app.core.celery_app import celery_app

# Import tasks so Celery can find them
from app.tasks import terraform_tasks
