from datetime import datetime
from typing import Any, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.resource import Project, Resource
from app.models.user import User
from app.schemas.deployment import DeploymentDetailResponse, DeploymentResponse

router = APIRouter()


FINAL_STATUSES = {"active", "failed", "destroyed", "inactive", "stopped"}


def _extract_logs(terraform_output: Any) -> str:
    if not isinstance(terraform_output, dict):
        return ""

    logs = terraform_output.get("logs")
    if isinstance(logs, list):
        return "\n".join(str(line) for line in logs)
    if isinstance(logs, str):
        return logs

    # Fallback for failed queue/decryption cases where explicit logs are missing.
    message_parts: List[str] = []
    error = terraform_output.get("error")
    detail = terraform_output.get("detail")
    if error:
        message_parts.append(str(error))
    if detail:
        message_parts.append(str(detail))
    return "\n".join(message_parts)


def _parse_completed_at(terraform_output: Any) -> Optional[datetime]:
    if not isinstance(terraform_output, dict):
        return None

    value = terraform_output.get("completed_at")
    if not value:
        return None

    if isinstance(value, datetime):
        return value

    if isinstance(value, str):
        candidate = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(candidate)
        except ValueError:
            return None

    return None


def _parse_duration(terraform_output: Any) -> Optional[int]:
    if not isinstance(terraform_output, dict):
        return None

    value = terraform_output.get("duration_seconds")
    if value is None:
        return None

    try:
        parsed = int(value)
    except (TypeError, ValueError):
        return None
    return parsed if parsed >= 0 else None


def _serialize_deployment(resource: Resource) -> DeploymentResponse:
    logs = _extract_logs(resource.terraform_output)
    completed_at = _parse_completed_at(resource.terraform_output)
    duration = _parse_duration(resource.terraform_output)

    if completed_at is None and (resource.status or "").lower() in FINAL_STATUSES and duration is not None:
        completed_at = resource.created_at

    return DeploymentResponse(
        id=resource.id,
        resource_id=resource.id,
        resource_name=resource.name,
        provider=resource.provider,
        resource_type=resource.type,
        status=resource.status,
        project_id=resource.project_id,
        started_at=resource.created_at,
        completed_at=completed_at,
        duration_seconds=duration,
        has_logs=bool(logs.strip()),
        log_line_count=len(logs.splitlines()) if logs else 0,
    )


@router.get("/", response_model=List[DeploymentResponse])
def list_deployments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resources = (
        db.query(Resource)
        .join(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Resource.created_at.desc(), Resource.id.desc())
        .all()
    )
    return [_serialize_deployment(resource) for resource in resources]


@router.get("/{deployment_id}", response_model=DeploymentDetailResponse)
def read_deployment(
    deployment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = (
        db.query(Resource)
        .join(Project)
        .filter(Resource.id == deployment_id, Project.user_id == current_user.id)
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Deployment not found")

    logs = _extract_logs(resource.terraform_output)
    completed_at = _parse_completed_at(resource.terraform_output)
    duration = _parse_duration(resource.terraform_output)

    return DeploymentDetailResponse(
        id=resource.id,
        resource_id=resource.id,
        resource_name=resource.name,
        provider=resource.provider,
        resource_type=resource.type,
        status=resource.status,
        project_id=resource.project_id,
        started_at=resource.created_at,
        completed_at=completed_at,
        duration_seconds=duration,
        has_logs=bool(logs.strip()),
        log_line_count=len(logs.splitlines()) if logs else 0,
        configuration=resource.configuration or {},
        terraform_output=resource.terraform_output or {},
        logs=logs,
    )


@router.delete("/{deployment_id}", status_code=204)
def delete_deployment(
    deployment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    resource = (
        db.query(Resource)
        .join(Project)
        .filter(Resource.id == deployment_id, Project.user_id == current_user.id)
        .first()
    )
    if not resource:
        raise HTTPException(status_code=404, detail="Deployment not found")

    db.delete(resource)
    db.commit()
    return None
