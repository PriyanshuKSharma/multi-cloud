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

if __name__ == "__main__":
    create_tables()
