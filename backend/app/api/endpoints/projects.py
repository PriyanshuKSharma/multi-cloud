from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.resource import Project, Resource
from app.models.resource_inventory import TerraformState
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectDetailResponse,
    ProjectResourceSummary,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.subscription import enforce_project_limit

router = APIRouter()


def _serialize_project(project: Project, include_resources: bool = False) -> ProjectResponse | ProjectDetailResponse:
    resources = sorted(
        list(project.resources or []),
        key=lambda item: ((item.created_at or datetime.min), item.id or 0),
        reverse=True,
    )
    now = project.created_at or datetime.utcnow()
    last_updated = max((r.created_at for r in resources if r.created_at), default=now)

    base_payload = {
        "id": project.id,
        "name": project.name,
        "description": project.description or f"Workspace for {project.name}",
        "resource_count": len(resources),
        "team_members": 1,
        "created_at": now,
        "last_updated": last_updated,
    }

    if not include_resources:
        return ProjectResponse(**base_payload)

    return ProjectDetailResponse(
        **base_payload,
        resources=[
            ProjectResourceSummary(
                id=resource.id,
                name=resource.name,
                provider=resource.provider,
                type=resource.type,
                status=resource.status,
                region=resource.region or (resource.configuration or {}).get("region"),
                created_at=resource.created_at or now,
            )
            for resource in resources
        ],
    )


@router.get("/", response_model=List[ProjectResponse])
def list_projects(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    projects = (
        db.query(Project)
        .filter(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc(), Project.id.desc())
        .all()
    )

    return [_serialize_project(project) for project in projects]


@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    enforce_project_limit(db, current_user)

    existing = (
        db.query(Project)
        .filter(Project.user_id == current_user.id, Project.name == project_in.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Project with this name already exists")

    project = Project(
        name=project_in.name,
        description=project_in.description,
        user_id=current_user.id,
    )
    db.add(project)
    db.commit()
    db.refresh(project)

    return _serialize_project(project)


@router.get("/{project_id}", response_model=ProjectDetailResponse)
def read_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    return _serialize_project(project, include_resources=True)


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    project_in: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    next_name = project.name
    if project_in.name is not None:
        trimmed_name = project_in.name.strip()
        if len(trimmed_name) < 2:
            raise HTTPException(status_code=400, detail="Project name must be at least 2 characters.")
        next_name = trimmed_name

    duplicate = (
        db.query(Project)
        .filter(
            Project.user_id == current_user.id,
            Project.name == next_name,
            Project.id != project.id,
        )
        .first()
    )
    if duplicate:
        raise HTTPException(status_code=400, detail="Project with this name already exists")

    if project_in.name is not None:
        project.name = next_name
    if project_in.description is not None:
        project.description = project_in.description.strip() or None

    db.add(project)
    db.commit()
    db.refresh(project)
    return _serialize_project(project)


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.user_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    resources: List[Resource] = (
        db.query(Resource)
        .filter(Resource.project_id == project.id)
        .order_by(Resource.id.desc())
        .all()
    )
    resource_ids = [resource.id for resource in resources]

    if resource_ids:
        db.query(TerraformState).filter(TerraformState.resource_id.in_(resource_ids)).delete(
            synchronize_session=False
        )
        for resource in resources:
            db.delete(resource)

    db.delete(project)
    db.commit()
    return {
        "message": "Project deleted successfully",
        "deleted_resources": len(resource_ids),
    }
