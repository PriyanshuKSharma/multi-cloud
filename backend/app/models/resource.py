from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base

class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    
    owner = relationship("User", back_populates="projects")
    resources = relationship("Resource", back_populates="project")

# Add backref to User model (circular import handling needed usually, but for simple MVP we can monkeypatch or adding it to user.py is better. 
# For now, let's assume User has 'projects' relationship defined or we define it here if SQLAlchemy allows, 
# but best practice is to define it in User or use string reference.)

class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, index=True)
    provider = Column(String) # aws, azure, gcp
    type = Column(String) # vm, storage
    status = Column(String, default="pending") # pending, provisioning, active, failed, destroying
    configuration = Column(JSON)
    terraform_output = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="resources")
