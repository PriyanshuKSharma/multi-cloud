"""
Database Migration Script
Creates all new tables for resource inventory, cost data, provider health, and terraform states
Run this after updating models
"""
from app.db.base import engine, Base
from app.models.user import User
from app.models.credential import CloudCredential
from app.models.resource import Project, Resource
from app.models.resource_inventory import ResourceInventory, CostData, ProviderHealth, TerraformState

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✅ All tables created successfully!")

if __name__ == "__main__":
    create_tables()
