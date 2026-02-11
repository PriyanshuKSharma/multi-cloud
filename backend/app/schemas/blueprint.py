from datetime import datetime
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class BlueprintBase(BaseModel):
    name: str
    description: str
    provider: str
    resource_type: str
    template: Dict[str, Any] = Field(default_factory=dict)


class BlueprintCreate(BlueprintBase):
    pass


class BlueprintResponse(BlueprintBase):
    id: int
    uses_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
