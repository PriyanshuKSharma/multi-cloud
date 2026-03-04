from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class ResourceBase(BaseModel):
    name: str
    provider: str
    type: str # vm, storage, faas
    configuration: Dict[str, Any]

class ResourceCreate(ResourceBase):
    project_id: int

class ResourceUpdate(BaseModel):
    status: Optional[str] = None
    terraform_output: Optional[Dict[str, Any]] = None

class ResourceResponse(ResourceBase):
    id: int
    project_id: int
    status: str
    terraform_output: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        orm_mode = True
