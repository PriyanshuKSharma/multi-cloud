from app.core.celery_app import celery_app
from app.tasks.sync_tasks import sync_user_resources
import os

print(f"Testing Celery delay...")
print(f"Broker: {celery_app.conf.broker_url}")

try:
    # We don't need a real user_id, we just want to see if it queues
    result = sync_user_resources.delay(1)
    print(f"Task queued successfully! ID: {result.id}")
except Exception as e:
    print(f"Failed to queue task: {e}")
    import traceback
    traceback.print_exc()
