from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.resource import Project
from app.models.user import User
from app.schemas.project import ProjectCreate, ProjectResponse

router = APIRouter()


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

    response: List[ProjectResponse] = []
    for project in projects:
        resources = list(project.resources or [])
        last_updated = max((r.created_at for r in resources if r.created_at), default=project.created_at or datetime.utcnow())
        response.append(
            ProjectResponse(
                id=project.id,
                name=project.name,
                description=project.description or f"Workspace for {project.name}",
                resource_count=len(resources),
                team_members=1,
                created_at=project.created_at or datetime.utcnow(),
                last_updated=last_updated,
            )
        )
    return response


@router.post("/", response_model=ProjectResponse)
def create_project(
    project_in: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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

    now = project.created_at or datetime.utcnow()
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description or f"Workspace for {project.name}",
        resource_count=0,
        team_members=1,
        created_at=now,
        last_updated=now,
    )


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

    if project.resources and len(project.resources) > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete project with existing resources. Delete resources first.",
        )

    db.delete(project)
    db.commit()
    return {"message": "Project deleted successfully"}
