from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.blueprint import Blueprint
from app.models.user import User
from app.schemas.blueprint import BlueprintCreate, BlueprintResponse

router = APIRouter()


@router.get("/", response_model=List[BlueprintResponse])
def list_blueprints(
    provider: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Blueprint).filter(Blueprint.user_id == current_user.id)
    if provider:
        query = query.filter(Blueprint.provider == provider.lower())
    if resource_type:
        query = query.filter(Blueprint.resource_type == resource_type.lower())
    return query.order_by(Blueprint.updated_at.desc(), Blueprint.id.desc()).all()


@router.post("/", response_model=BlueprintResponse)
def create_blueprint(
    blueprint_in: BlueprintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = (
        db.query(Blueprint)
        .filter(Blueprint.user_id == current_user.id, Blueprint.name == blueprint_in.name)
        .first()
    )
    if existing:
        raise HTTPException(status_code=400, detail="Blueprint name already exists")

    blueprint = Blueprint(
        user_id=current_user.id,
        name=blueprint_in.name.strip(),
        description=blueprint_in.description.strip(),
        provider=blueprint_in.provider.lower(),
        resource_type=blueprint_in.resource_type.lower(),
        template=blueprint_in.template or {},
    )
    db.add(blueprint)
    db.commit()
    db.refresh(blueprint)
    return blueprint


@router.post("/{blueprint_id}/use", response_model=BlueprintResponse)
def mark_blueprint_used(
    blueprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blueprint = (
        db.query(Blueprint)
        .filter(Blueprint.id == blueprint_id, Blueprint.user_id == current_user.id)
        .first()
    )
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    blueprint.uses_count += 1
    db.add(blueprint)
    db.commit()
    db.refresh(blueprint)
    return blueprint


@router.delete("/{blueprint_id}")
def delete_blueprint(
    blueprint_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    blueprint = (
        db.query(Blueprint)
        .filter(Blueprint.id == blueprint_id, Blueprint.user_id == current_user.id)
        .first()
    )
    if not blueprint:
        raise HTTPException(status_code=404, detail="Blueprint not found")

    db.delete(blueprint)
    db.commit()
    return {"message": "Blueprint deleted"}

