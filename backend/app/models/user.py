from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for SSO users
    is_active = Column(Boolean, default=True)
    is_superuser = Column(Boolean, default=False)
    
    full_name = Column(String, index=True)
    job_profile = Column(String)
    organization = Column(String)
    phone_number = Column(String)
    
    # 2FA fields
    two_factor_enabled = Column(Boolean, default=False)
    two_factor_secret = Column(String, nullable=True)
    
    # SSO fields
    sso_provider = Column(String, nullable=True)  # 'google', 'github', etc.
    sso_id = Column(String, nullable=True)  # Provider's user ID
    
    last_password_change = Column(DateTime, nullable=True)
    
    projects = relationship("Project", back_populates="owner")
