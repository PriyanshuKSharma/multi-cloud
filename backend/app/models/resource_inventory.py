from sqlalchemy import Column, Integer, String, ForeignKey, JSON, DateTime, Float, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.base import Base


class ResourceInventory(Base):
    """Cached cloud resources from provider APIs"""
    __tablename__ = "resource_inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(20), nullable=False)  # aws, azure, gcp
    resource_type = Column(String(50), nullable=False)  # vm, storage, vpc, subnet, etc.
    resource_id = Column(String(255), nullable=False)  # Cloud provider's resource ID
    resource_name = Column(String(255))
    region = Column(String(100))
    status = Column(String(50))  # running, stopped, terminated, active, etc.
    instance_type = Column(String(50))  # For VMs: t3.medium, Standard_B2s, etc.
    public_ip = Column(String(50))
    private_ip = Column(String(50))
    resource_metadata = Column(JSON)  # Provider-specific details (renamed from metadata)
    tags = Column(JSON)
    cost_per_hour = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_synced_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="resource_inventory")

    # Unique constraint: one resource per provider per user
    __table_args__ = (
        UniqueConstraint('provider', 'resource_id', 'user_id', name='uix_provider_resource_user'),
    )

    def __repr__(self):
        return f"<ResourceInventory {self.provider}:{self.resource_type}:{self.resource_name}>"


class CostData(Base):
    """Billing and cost information from cloud providers"""
    __tablename__ = "cost_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(20), nullable=False)  # aws, azure, gcp
    service_name = Column(String(100))  # EC2, S3, Compute, Blob Storage, etc.
    resource_id = Column(String(255))  # Optional: link to specific resource
    cost_amount = Column(Float, nullable=False)
    currency = Column(String(10), default='USD')
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    cost_details = Column(String(1000))  # Additional cost details (renamed from metadata)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", backref="cost_data")

    def __repr__(self):
        return f"<CostData {self.provider}:{self.service_name}:${self.cost_amount}>"


class ProviderHealth(Base):
    """API connectivity and health status for cloud providers"""
    __tablename__ = "provider_health"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    provider = Column(String(20), nullable=False)  # aws, azure, gcp
    credential_id = Column(Integer, ForeignKey("cloud_credentials.id"))
    status = Column(String(20), default='unknown')  # healthy, degraded, error
    last_check_at = Column(DateTime, default=datetime.utcnow)
    error_message = Column(String(500))
    response_time_ms = Column(Integer)

    # Relationships
    user = relationship("User", backref="provider_health")
    credential = relationship("CloudCredential", backref="health_checks")

    def __repr__(self):
        return f"<ProviderHealth {self.provider}:{self.status}>"


class TerraformState(Base):
    """Terraform state tracking and drift detection"""
    __tablename__ = "terraform_states"

    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(Integer, ForeignKey("resources.id"), nullable=False)
    state_data = Column(JSON)  # Full terraform.tfstate content
    outputs = Column(JSON)  # Extracted outputs
    resources_managed = Column(JSON)  # List of resources in state
    last_applied_at = Column(DateTime)
    drift_detected = Column(String(20), default='synced')  # synced, drift, unknown
    drift_details = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    resource = relationship("Resource", backref="terraform_states")

    def __repr__(self):
        return f"<TerraformState resource_id={self.resource_id} drift={self.drift_detected}>"
