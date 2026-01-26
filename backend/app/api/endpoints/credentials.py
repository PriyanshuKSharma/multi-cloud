from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import json

from app.db.base import get_db
from app.models.credential import CloudCredential
from app.models.user import User
from app.schemas.credential import CredentialCreate, CredentialResponse
from app.api.deps import get_current_user
from app.core.security import encrypt_data

router = APIRouter()

@router.post("/", response_model=CredentialResponse)
def create_credential(
    cred: CredentialCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if credential already exists for this provider (optional constraint, skip for now)
    
    # Encrypt the data dict
    json_str = json.dumps(cred.data)
    encrypted = encrypt_data(json_str)
    
    db_cred = CloudCredential(
        name=cred.name,
        provider=cred.provider,
        user_id=current_user.id,
        encrypted_data=encrypted
    )
    
    db.add(db_cred)
    db.commit()
    db.refresh(db_cred)
    return db_cred

@router.get("/", response_model=List[CredentialResponse])
def read_credentials(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    creds = db.query(CloudCredential).filter(CloudCredential.user_id == current_user.id).all()
    return creds

@router.delete("/{credential_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_credential(
    credential_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    cred = db.query(CloudCredential).filter(CloudCredential.id == credential_id, CloudCredential.user_id == current_user.id).first()
    if not cred:
        raise HTTPException(status_code=404, detail="Credential not found")
        
    db.delete(cred)
    db.commit()
    return None
