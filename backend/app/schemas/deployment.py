from datetime import datetime
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class DeploymentResponse(BaseModel):
    id: int
    resource_id: int
    resource_name: str
    provider: str
    resource_type: str
    status: str
    project_id: int
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[int] = None
    has_logs: bool = False
    log_line_count: int = 0


class DeploymentDetailResponse(DeploymentResponse):
    configuration: Dict[str, Any] = Field(default_factory=dict)
    terraform_output: Dict[str, Any] = Field(default_factory=dict)
    logs: str = ""
