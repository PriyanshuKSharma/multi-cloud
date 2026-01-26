from typing import List
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.resource import Resource, Project
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceResponse
from app.api.deps import get_current_user
from app.worker import provision_resource_task
import json

from app.services.cloud_sync import CloudSyncService

router = APIRouter()

@router.get("/stats")
def get_resource_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # 1. Get detailed cloud stats
    syncer = CloudSyncService(db, current_user.id)
    real_time_stats = syncer.get_aggregate_stats()
    
    # 2. Get local DB stats
    local_count = db.query(Resource).filter(
        Project.user_id == current_user.id,
        Resource.status == "active"
    ).join(Project).count()
    
    # 3. Calculate simulated costs (Mocking logic for now based on count)
    total_cost = (real_time_stats["total_instances"] * 25.0) + (local_count * 10.0)
    
    return {
        "active_resources": real_time_stats["total_instances"],
        "managed_resources": local_count,
        "total_cost": f"${total_cost:.2f}",
        "storage_used": "1.2 TB", # Placeholder, would need S3/Blob sync
        "system_health": "100%",
        "provider_breakdown": real_time_stats["details"]
    }

@router.post("/", response_model=ResourceResponse)
def create_resource(
    resource_in: ResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Verify project belongs to user
    project = db.query(Project).filter(Project.id == resource_in.project_id, Project.user_id == current_user.id).first()
    if not project:
        # Auto-create default project for MVP ease
        if resource_in.project_id == 0:
             project = Project(name="Default Project", user_id=current_user.id)
             db.add(project)
             db.commit()
             db.refresh(project)
        else:
             raise HTTPException(status_code=404, detail="Project not found")

    resource = Resource(
        name=resource_in.name,
        provider=resource_in.provider,
        type=resource_in.type,
        project_id=project.id,
        configuration=resource_in.configuration,
        status="pending"
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)

    # Trigger Async Job
    # In real app, choose module based on provider/type
    module_name = f"{resource_in.provider}_{resource_in.type}" # e.g., aws_vm
    
    # Map configuration to TF Vars
    tf_vars = resource_in.configuration
    
    provision_resource_task.delay(
        resource_id=str(resource.id),
        provider=resource_in.provider,
        module_name=module_name,
        variables=tf_vars
    )

    return resource

@router.get("/", response_model=List[ResourceResponse])
def read_resources(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Join with projects to filter by user
    resources = db.query(Resource).join(Project).filter(Project.user_id == current_user.id).offset(skip).limit(limit).all()
    return resources

@router.get("/{resource_id}", response_model=ResourceResponse)
def read_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).join(Project).filter(Resource.id == resource_id, Project.user_id == current_user.id).first()
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    return resource
