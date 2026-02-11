"""
Database Migration Script
Creates all new tables for resource inventory, cost data, provider health, and terraform states
Run this after updating models
"""
from sqlalchemy import inspect, text
from app.db.base import engine, Base
from app.models.user import User
from app.models.credential import CloudCredential
from app.models.resource import Project, Resource
from app.models.blueprint import Blueprint
from app.models.resource_inventory import ResourceInventory, CostData, ProviderHealth, TerraformState

def create_tables():
    """Create all database tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    ensure_user_columns()
    ensure_project_columns()
    ensure_resource_columns()
    print("✅ All tables created successfully!")


def ensure_user_columns():
    """Adds missing profile/security columns to existing users table."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "users" not in table_names:
        return

    existing = {col["name"] for col in inspector.get_columns("users")}
    dialect = engine.dialect.name

    column_defs = {
        "full_name": "VARCHAR",
        "job_profile": "VARCHAR",
        "organization": "VARCHAR",
        "phone_number": "VARCHAR",
        "two_factor_enabled": "BOOLEAN DEFAULT FALSE" if dialect != "sqlite" else "BOOLEAN DEFAULT 0",
        "last_password_change": "TIMESTAMP",
    }

    with engine.begin() as conn:
        for column, ddl in column_defs.items():
            if column not in existing:
                conn.execute(text(f"ALTER TABLE users ADD COLUMN {column} {ddl}"))

def ensure_resource_columns():
    """Adds missing columns to existing resources table."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "resources" not in table_names:
        return

    existing = {col["name"] for col in inspector.get_columns("resources")}
    
    column_defs = {
        "cloud_resource_id": "VARCHAR(255)",
        "public_ip": "VARCHAR(50)",
        "private_ip": "VARCHAR(50)",
        "instance_type": "VARCHAR(50)",
        "region": "VARCHAR(100)",
        "cost_per_hour": "JSON",
        "last_synced_at": "TIMESTAMP",
        "drift_status": "VARCHAR(20) DEFAULT 'synced'",
    }

    with engine.begin() as conn:
        for column, ddl in column_defs.items():
            if column not in existing:
                print(f"Migrating resources: Adding {column}")
                conn.execute(text(f"ALTER TABLE resources ADD COLUMN {column} {ddl}"))


def ensure_project_columns():
    """Adds missing columns to existing projects table."""
    inspector = inspect(engine)
    table_names = inspector.get_table_names()
    if "projects" not in table_names:
        return

    existing = {col["name"] for col in inspector.get_columns("projects")}

    column_defs = {
        "description": "VARCHAR",
    }

    with engine.begin() as conn:
        for column, ddl in column_defs.items():
            if column not in existing:
                print(f"Migrating projects: Adding {column}")
                conn.execute(text(f"ALTER TABLE projects ADD COLUMN {column} {ddl}"))

if __name__ == "__main__":
    create_tables()
