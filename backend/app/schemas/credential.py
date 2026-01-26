from pydantic import BaseModel
from typing import Dict, Any, Optional
from datetime import datetime

class CredentialBase(BaseModel):
    provider: str
    name: str

class CredentialCreate(CredentialBase):
    data: Dict[str, Any] # Raw credentials from frontend (will be encrypted)

class CredentialUpdate(BaseModel):
    name: Optional[str] = None
    data: Optional[Dict[str, Any]] = None

class CredentialResponse(CredentialBase):
    id: int
    created_at: datetime
    # We NEVER return the actual credentials in the response for security
    
    class Config:
        from_attributes = True
