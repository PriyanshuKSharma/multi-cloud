from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


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

