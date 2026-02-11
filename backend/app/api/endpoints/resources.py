from typing import List
import logging
import json

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.resource import Resource, Project
from app.models.credential import CloudCredential
from app.models.user import User
from app.schemas.resource import ResourceCreate, ResourceResponse
from app.api.deps import get_current_user
from app.worker import provision_resource_task
from app.core.security import decrypt_data

from app.services.cloud_sync import CloudSyncService

router = APIRouter()
logger = logging.getLogger(__name__)


def _get_storage_resource_for_user(
    resource_id: int,
    current_user: User,
    db: Session,
) -> Resource:
    resource = (
        db.query(Resource)
        .join(Project)
        .filter(Resource.id == resource_id, Project.user_id == current_user.id)
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    if resource.type != "storage":
        raise HTTPException(status_code=400, detail="Resource is not a storage bucket")
    return resource


def _get_aws_s3_client_for_storage_resource(
    resource: Resource,
    current_user: User,
    db: Session,
):
    if (resource.provider or "").lower() != "aws":
        raise HTTPException(
            status_code=400,
            detail="Storage object operations are currently supported only for AWS resources",
        )

    cred = (
        db.query(CloudCredential)
        .filter(
            CloudCredential.user_id == current_user.id,
            CloudCredential.provider == "aws",
        )
        .order_by(CloudCredential.id.desc())
        .first()
    )
    if not cred:
        raise HTTPException(status_code=400, detail="No AWS credential found for this user")

    try:
        cred_data = json.loads(decrypt_data(cred.encrypted_data))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to decrypt AWS credential: {exc}") from exc

    access_key = cred_data.get("access_key")
    secret_key = cred_data.get("secret_key")
    region = (
        cred_data.get("region")
        or (resource.configuration or {}).get("region")
        or "us-east-1"
    )
    if not access_key or not secret_key:
        raise HTTPException(status_code=400, detail="AWS credential is missing access key or secret key")

    bucket_name = (resource.configuration or {}).get("bucket_name") or resource.name
    if not bucket_name:
        raise HTTPException(status_code=400, detail="Bucket name is missing in resource configuration")

    client = boto3.client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )
    return client, bucket_name

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
        "provider_breakdown": real_time_stats["details"],
        "cost_by_provider": real_time_stats["cost_by_provider"],
        "cost_by_service": real_time_stats["cost_by_service"]
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
    # Map (provider, type) to correct Terraform module directory
    MODULE_MAP = {
        ("aws", "storage"): "aws_s3",
        ("aws", "vm"): "aws_vm",
        ("azure", "storage"): "azure_blob",
        ("azure", "vm"): "azure_vm",
        ("gcp", "storage"): "gcp_storage",
        ("gcp", "vm"): "gcp_vm",
    }
    
    module_name = MODULE_MAP.get((resource_in.provider, resource_in.type), f"{resource_in.provider}_{resource_in.type}")
    
    # Map configuration to TF Vars
    tf_vars = resource_in.configuration
    
    # Provider-specific variable translation
    if resource_in.provider == "azure":
        if resource_in.type == "vm":
            # Translate region to location for Azure
            if "region" in tf_vars:
                tf_vars["location"] = tf_vars.pop("region")
            # Ensure instance_name is set (frontend usually does this but as a safety)
            if "instance_name" not in tf_vars:
                tf_vars["instance_name"] = resource.name
        elif resource_in.type == "storage":
            if "region" in tf_vars:
                tf_vars["location"] = tf_vars.pop("region")
    
    try:
        provision_resource_task.delay(
            resource_id=str(resource.id),
            provider=resource_in.provider,
            module_name=module_name,
            variables=tf_vars
        )
    except Exception as exc:
        # Do not fail resource creation if async worker/broker is down.
        logger.exception("Failed to queue provisioning task for resource %s", resource.id)
        resource.status = "failed"
        resource.terraform_output = {
            "error": "Failed to queue provisioning task",
            "detail": str(exc),
        }
        db.add(resource)
        db.commit()
        db.refresh(resource)

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

@router.delete("/{resource_id}")
def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    resource = db.query(Resource).join(Project).filter(
        Resource.id == resource_id, 
        Project.user_id == current_user.id
    ).first()
    
    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")
    
    db.delete(resource)
    db.commit()
    return {"message": "Resource record deleted successfully"}


@router.get("/{resource_id}/storage/objects")
def list_storage_objects(
    resource_id: int,
    prefix: str = Query("", description="Optional key prefix"),
    max_keys: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = _get_storage_resource_for_user(resource_id, current_user, db)
    s3_client, bucket_name = _get_aws_s3_client_for_storage_resource(resource, current_user, db)

    try:
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix=prefix or "",
            MaxKeys=max_keys,
        )
    except ClientError as exc:
        detail = exc.response.get("Error", {}).get("Message", str(exc))
        raise HTTPException(status_code=400, detail=f"Failed to list bucket objects: {detail}") from exc

    items = []
    for obj in response.get("Contents", []):
        last_modified = obj.get("LastModified")
        items.append(
            {
                "key": obj.get("Key"),
                "size": obj.get("Size", 0),
                "etag": obj.get("ETag"),
                "last_modified": last_modified.isoformat() if last_modified else None,
            }
        )

    return {
        "bucket": bucket_name,
        "count": len(items),
        "truncated": bool(response.get("IsTruncated", False)),
        "items": items,
    }


@router.post("/{resource_id}/storage/upload")
def upload_storage_object(
    resource_id: int,
    file: UploadFile = File(...),
    key: str = Form(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = _get_storage_resource_for_user(resource_id, current_user, db)
    s3_client, bucket_name = _get_aws_s3_client_for_storage_resource(resource, current_user, db)

    object_key = (key or file.filename or "").strip()
    if not object_key:
        raise HTTPException(status_code=400, detail="Object key is required")

    extra_args = {}
    if file.content_type:
        extra_args["ContentType"] = file.content_type

    try:
        if extra_args:
            s3_client.upload_fileobj(file.file, bucket_name, object_key, ExtraArgs=extra_args)
        else:
            s3_client.upload_fileobj(file.file, bucket_name, object_key)
    except ClientError as exc:
        detail = exc.response.get("Error", {}).get("Message", str(exc))
        raise HTTPException(status_code=400, detail=f"Failed to upload object: {detail}") from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Upload failed: {exc}") from exc
    finally:
        file.file.close()

    return {
        "message": "Object uploaded successfully",
        "bucket": bucket_name,
        "key": object_key,
        "content_type": file.content_type,
    }


@router.get("/{resource_id}/storage/download")
def download_storage_object(
    resource_id: int,
    key: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = _get_storage_resource_for_user(resource_id, current_user, db)
    s3_client, bucket_name = _get_aws_s3_client_for_storage_resource(resource, current_user, db)

    try:
        obj = s3_client.get_object(Bucket=bucket_name, Key=key)
    except ClientError as exc:
        detail = exc.response.get("Error", {}).get("Message", str(exc))
        raise HTTPException(status_code=400, detail=f"Failed to download object: {detail}") from exc

    body = obj.get("Body")
    if body is None:
        raise HTTPException(status_code=404, detail="Object body is empty")

    media_type = obj.get("ContentType") or "application/octet-stream"
    filename = key.split("/")[-1] or "download"
    headers = {"Content-Disposition": f'attachment; filename="{filename}"'}

    return StreamingResponse(body, media_type=media_type, headers=headers)
