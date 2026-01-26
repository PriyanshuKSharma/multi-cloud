from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class CloudCredential(Base):
    __tablename__ = "cloud_credentials"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    provider = Column(String, index=True) # aws, azure, gcp
    name = Column(String) # e.g. "My AWS Prod"
    
    # Store encrypted fields as a JSON blob
    # AWS: { "access_key": "...", "secret_key": "..." }
    # Azure: { "client_id": "...", "client_secret": "...", "tenant_id": "...", "subscription_id": "..." }
    # GCP: { "service_account_json": "..." }
    encrypted_data = Column(String) 
    
    created_at = Column(DateTime, default=datetime.utcnow)

    # For now, simplistic relationship assuming User model will update
    # owner = relationship("User", back_populates="credentials")
