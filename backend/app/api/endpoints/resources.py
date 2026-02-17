from typing import Dict, List, Optional, Tuple, Union
import logging
import json
import re

import boto3
from botocore.exceptions import ClientError
from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.resource import Resource, Project
from app.models.credential import CloudCredential
from app.models.user import User
from app.models.resource_inventory import ResourceInventory
from app.schemas.resource import ResourceCreate, ResourceResponse
from app.api.deps import get_current_user
from app.worker import provision_resource_task
from app.core.security import decrypt_data

from app.services.cloud_sync import CloudSyncService

router = APIRouter()
logger = logging.getLogger(__name__)


AWS_DEFAULT_AMI_BY_REGION: Dict[str, str] = {
    "us-east-1": "ami-0c02fb55956c7d316",      # Amazon Linux 2
    "us-west-2": "ami-0892d3c7ee96c0bf7",
    "ap-south-1": "ami-0f5ee92e2d63afc18",
    "eu-west-1": "ami-08f312f60f5433162",
    "ap-southeast-1": "ami-047126e50991d067b",
}


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




def _get_inventory_resource_for_user(
    resource_id: int,
    current_user: User,
    db: Session,
) -> ResourceInventory:
    resource = (
        db.query(ResourceInventory)
        .filter(ResourceInventory.id == resource_id, ResourceInventory.user_id == current_user.id)
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Inventory resource not found")
    if resource.resource_type != "storage":
        raise HTTPException(status_code=400, detail="Resource is not a storage bucket")
    return resource
def _get_aws_s3_client_for_storage_resource(
    resource: Union[Resource, ResourceInventory],
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
    
    # Handle different models
    if isinstance(resource, Resource):
        config = resource.configuration or {}
        resource_region = config.get("region")
        bucket_name = config.get("bucket_name") or resource.name
    else:  # ResourceInventory
        resource_region = resource.region
        bucket_name = resource.resource_name

    region = (
        cred_data.get("region")
        or resource_region
        or "us-east-1"
    )
    if not access_key or not secret_key:
        raise HTTPException(status_code=400, detail="AWS credential is missing access key or secret key")

    if not bucket_name:
        raise HTTPException(status_code=400, detail="Bucket name is missing in resource configuration")

    client = boto3.client(
        "s3",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )
    return client, bucket_name


def _get_vm_resource_for_user(
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
    if resource.type != "vm":
        raise HTTPException(status_code=400, detail="Resource is not a virtual machine")
    return resource


def _get_provider_credential_data(
    provider: str,
    current_user: User,
    db: Session,
) -> Dict[str, str]:
    credential = (
        db.query(CloudCredential)
        .filter(
            CloudCredential.user_id == current_user.id,
            CloudCredential.provider == provider,
        )
        .order_by(CloudCredential.id.desc())
        .first()
    )
    if not credential:
        raise HTTPException(status_code=400, detail=f"No {provider.upper()} credential found for this user")

    try:
        decrypted_json = decrypt_data(credential.encrypted_data)
        data = json.loads(decrypted_json)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to decrypt {provider.upper()} credential: {exc}") from exc

    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail=f"{provider.upper()} credential payload is invalid")

    return data


def _get_aws_ec2_client_for_vm_resource(
    resource: Resource,
    current_user: User,
    db: Session,
) -> Tuple[object, str]:
    if (resource.provider or "").lower() != "aws":
        raise HTTPException(
            status_code=400,
            detail="VM actions are currently supported only for AWS resources",
        )

    credential_data = _get_provider_credential_data("aws", current_user, db)
    access_key = credential_data.get("access_key")
    secret_key = credential_data.get("secret_key")

    if not access_key or not secret_key:
        raise HTTPException(status_code=400, detail="AWS credential is missing access key or secret key")

    configuration = resource.configuration or {}
    region = (
        configuration.get("region")
        or resource.region
        or credential_data.get("region")
        or "us-east-1"
    )

    ec2_client = boto3.client(
        "ec2",
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=region,
    )
    return ec2_client, str(region)


def _extract_instance_id_from_terraform_output(terraform_output: Optional[Dict[str, object]]) -> Optional[str]:
    if not terraform_output or not isinstance(terraform_output, dict):
        return None

    possible_fields = ["instance_id", "vm_id", "cloud_resource_id", "resource_id", "id"]
    for field in possible_fields:
        value = terraform_output.get(field)
        if isinstance(value, str) and value.startswith("i-"):
            return value

    logs = terraform_output.get("logs")
    if isinstance(logs, str):
        match = re.search(r'instance_id\s*=\s*"?((?:i-[a-zA-Z0-9]+))"?', logs)
        if match:
            return match.group(1)

    return None


def _instance_exists(ec2_client, instance_id: str) -> bool:
    try:
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code")
        if code in {"InvalidInstanceID.NotFound", "InvalidInstanceID.Malformed"}:
            return False
        raise

    for reservation in response.get("Reservations", []):
        for instance in reservation.get("Instances", []):
            if instance.get("InstanceId") == instance_id:
                return True
    return False


def _resolve_aws_instance_id(
    resource: Resource,
    ec2_client,
) -> Optional[str]:
    candidate_ids: List[str] = []
    if resource.cloud_resource_id and str(resource.cloud_resource_id).startswith("i-"):
        candidate_ids.append(str(resource.cloud_resource_id))

    output_id = _extract_instance_id_from_terraform_output(resource.terraform_output)
    if output_id:
        candidate_ids.append(output_id)

    for instance_id in candidate_ids:
        if _instance_exists(ec2_client, instance_id):
            return instance_id

    # Fallback: locate by Name tag for resources created by this platform.
    response = ec2_client.describe_instances(
        Filters=[
            {"Name": "tag:Name", "Values": [resource.name]},
            {"Name": "instance-state-name", "Values": ["pending", "running", "stopping", "stopped"]},
        ]
    )

    candidates: List[Tuple[str, str]] = []
    for reservation in response.get("Reservations", []):
        for instance in reservation.get("Instances", []):
            instance_id = instance.get("InstanceId")
            launch_time = instance.get("LaunchTime")
            if instance_id:
                launch_key = launch_time.isoformat() if launch_time else ""
                candidates.append((instance_id, launch_key))

    if not candidates:
        return None

    candidates.sort(key=lambda item: item[1], reverse=True)
    return candidates[0][0]

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
    provider = (resource_in.provider or "").lower()
    resource_type = (resource_in.type or "").lower()

    # Fail fast if no credential exists for the selected provider.
    credential = (
        db.query(CloudCredential)
        .filter(
            CloudCredential.user_id == current_user.id,
            CloudCredential.provider == provider,
        )
        .order_by(CloudCredential.id.desc())
        .first()
    )
    if not credential:
        raise HTTPException(
            status_code=400,
            detail=f"No {provider.upper()} credential found. Connect a cloud account first.",
        )

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

    base_configuration = dict(resource_in.configuration or {})

    resource = Resource(
        name=resource_in.name,
        provider=provider,
        type=resource_type,
        project_id=project.id,
        configuration=base_configuration,
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
    
    module_name = MODULE_MAP.get((provider, resource_type), f"{provider}_{resource_type}")
    
    # Map configuration to TF Vars
    tf_vars = dict(base_configuration)
    
    # Provider-specific variable translation
    if provider == "aws" and resource_type == "vm":
        tf_vars.setdefault("instance_name", resource.name)
        tf_vars.setdefault("instance_type", "t3.micro")
        region = tf_vars.get("region", "us-east-1")
        tf_vars.setdefault("ami", AWS_DEFAULT_AMI_BY_REGION.get(region, AWS_DEFAULT_AMI_BY_REGION["us-east-1"]))

        subnet_id = str(tf_vars.get("subnet_id", "")).strip()
        if subnet_id:
            tf_vars["subnet_id"] = subnet_id
        else:
            tf_vars.pop("subnet_id", None)

        key_name = str(tf_vars.get("key_name", "")).strip()
        if key_name:
            tf_vars["key_name"] = key_name
        else:
            tf_vars.pop("key_name", None)

        if "vpc_security_group_ids" not in tf_vars and "security_groups" in tf_vars:
            security_groups_raw = tf_vars.pop("security_groups")
            if isinstance(security_groups_raw, str):
                security_group_ids = [item.strip() for item in security_groups_raw.split(",") if item.strip()]
            elif isinstance(security_groups_raw, list):
                security_group_ids = [str(item).strip() for item in security_groups_raw if str(item).strip()]
            else:
                security_group_ids = []

            if security_group_ids:
                tf_vars["vpc_security_group_ids"] = security_group_ids

        if isinstance(tf_vars.get("vpc_security_group_ids"), str):
            tf_vars["vpc_security_group_ids"] = [
                item.strip() for item in str(tf_vars["vpc_security_group_ids"]).split(",") if item.strip()
            ]
    elif provider == "azure":
        if resource_type == "vm":
            if "region" in tf_vars and "location" not in tf_vars:
                tf_vars["location"] = tf_vars["region"]
            tf_vars.setdefault("vm_name", resource.name)
            tf_vars.setdefault("resource_group_name", f"nebula-rg-{resource.id}")
        elif resource_type == "storage":
            if "region" in tf_vars and "location" not in tf_vars:
                tf_vars["location"] = tf_vars["region"]
    elif provider == "gcp" and resource_type == "vm":
        tf_vars.setdefault("instance_name", resource.name)
        if "region" in tf_vars and "zone" not in tf_vars:
            tf_vars["zone"] = f"{tf_vars['region']}-a"

    try:
        provision_resource_task.delay(
            resource_id=str(resource.id),
            provider=provider,
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


@router.post("/{resource_id}/vm/start")
def start_virtual_machine(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = _get_vm_resource_for_user(resource_id, current_user, db)
    ec2_client, region = _get_aws_ec2_client_for_vm_resource(resource, current_user, db)

    instance_id = _resolve_aws_instance_id(resource, ec2_client)
    if not instance_id:
        raise HTTPException(status_code=404, detail="No AWS instance found for this resource")

    try:
        response = ec2_client.start_instances(InstanceIds=[instance_id])
    except ClientError as exc:
        detail = exc.response.get("Error", {}).get("Message", str(exc))
        raise HTTPException(status_code=400, detail=f"Failed to start instance: {detail}") from exc

    current_state = "pending"
    started_instances = response.get("StartingInstances", [])
    if started_instances:
        current_state = started_instances[0].get("CurrentState", {}).get("Name", "pending")

    resource.cloud_resource_id = instance_id
    resource.region = region
    resource.status = "active" if current_state in {"pending", "running"} else resource.status
    db.add(resource)
    db.commit()

    return {
        "message": "Start action submitted",
        "instance_id": instance_id,
        "state": current_state,
        "resource_status": resource.status,
    }


@router.post("/{resource_id}/vm/stop")
def stop_virtual_machine(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = _get_vm_resource_for_user(resource_id, current_user, db)
    ec2_client, region = _get_aws_ec2_client_for_vm_resource(resource, current_user, db)

    instance_id = _resolve_aws_instance_id(resource, ec2_client)
    if not instance_id:
        raise HTTPException(status_code=404, detail="No AWS instance found for this resource")

    try:
        response = ec2_client.stop_instances(InstanceIds=[instance_id])
    except ClientError as exc:
        detail = exc.response.get("Error", {}).get("Message", str(exc))
        raise HTTPException(status_code=400, detail=f"Failed to stop instance: {detail}") from exc

    current_state = "stopping"
    stopping_instances = response.get("StoppingInstances", [])
    if stopping_instances:
        current_state = stopping_instances[0].get("CurrentState", {}).get("Name", "stopping")

    resource.cloud_resource_id = instance_id
    resource.region = region
    resource.status = "stopped" if current_state in {"stopping", "stopped"} else resource.status
    db.add(resource)
    db.commit()

    return {
        "message": "Stop action submitted",
        "instance_id": instance_id,
        "state": current_state,
        "resource_status": resource.status,
    }


@router.delete("/{resource_id}/vm")
def destroy_virtual_machine(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = _get_vm_resource_for_user(resource_id, current_user, db)
    ec2_client, _ = _get_aws_ec2_client_for_vm_resource(resource, current_user, db)

    instance_id = _resolve_aws_instance_id(resource, ec2_client)
    cloud_action = "not_found"

    if instance_id:
        try:
            response = ec2_client.terminate_instances(InstanceIds=[instance_id])
            cloud_action = "terminate_requested"
            terminating = response.get("TerminatingInstances", [])
            if terminating:
                cloud_action = terminating[0].get("CurrentState", {}).get("Name", "terminate_requested")
        except ClientError as exc:
            error_code = exc.response.get("Error", {}).get("Code")
            if error_code != "InvalidInstanceID.NotFound":
                detail = exc.response.get("Error", {}).get("Message", str(exc))
                raise HTTPException(status_code=400, detail=f"Failed to destroy instance: {detail}") from exc
            cloud_action = "already_terminated"

    resource_name = resource.name
    db.delete(resource)
    db.commit()

    return {
        "message": f'Resource "{resource_name}" deleted successfully',
        "instance_id": instance_id,
        "cloud_action": cloud_action,
    }


@router.get("/{resource_id}/storage/objects")
def list_storage_objects(
    resource_id: int,
    prefix: str = Query("", description="Optional key prefix"),
    max_keys: int = Query(100, ge=1, le=500),
    source: str = Query("provisioning", description="Source of the resource: 'provisioning' or 'inventory'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if source == 'inventory':
        resource = _get_inventory_resource_for_user(resource_id, current_user, db)
    else:
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
    source: str = Query("provisioning", description="Source of the resource: 'provisioning' or 'inventory'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if source == 'inventory':
        resource = _get_inventory_resource_for_user(resource_id, current_user, db)
    else:
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
    source: str = Query("provisioning", description="Source of the resource: 'provisioning' or 'inventory'"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if source == 'inventory':
        resource = _get_inventory_resource_for_user(resource_id, current_user, db)
    else:
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
