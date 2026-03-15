from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class ProjectResourceSummary(BaseModel):
    id: int
    name: str
    provider: str
    type: str
    status: str
    region: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class ProjectResponse(BaseModel):
    id: int
    name: str
    description: str
    resource_count: int
    team_members: int
    created_at: datetime
    last_updated: datetime

    class Config:
        from_attributes = True


class ProjectDetailResponse(ProjectResponse):
    resources: list[ProjectResourceSummary]
