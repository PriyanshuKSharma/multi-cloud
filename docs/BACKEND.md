# Backend Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Project Structure](#2-project-structure)
3. [Core Components](#3-core-components)
4. [Database Models](#4-database-models)
5. [API Endpoints](#5-api-endpoints)
6. [Services](#6-services)
7. [Middleware](#7-middleware)
8. [Authentication](#8-authentication)
9. [Error Handling](#9-error-handling)

---

## 1. Overview

The backend is built with **FastAPI**, a modern Python web framework that provides:

- Automatic API documentation (Swagger/OpenAPI)
- Type validation with Pydantic
- Async support
- High performance (comparable to Node.js)

**Key Technologies:**

- **FastAPI** - Web framework
- **SQLAlchemy 2.0** - ORM
- **Pydantic** - Data validation
- **JWT** - Authentication
- **Alembic** - Database migrations
- **Celery** - Background tasks

---

## 2. Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # FastAPI app entry point
│   ├── worker.py                  # Celery worker entry point
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── endpoints/             # API route handlers
│   │       ├── auth.py            # Authentication endpoints
│   │       ├── dashboard.py       # Dashboard stats API
│   │       ├── inventory.py       # Resource inventory API
│   │       ├── billing.py         # Cost & billing API
│   │       ├── resources.py       # Terraform resource API
│   │       └── credentials.py     # Cloud credentials API
│   │
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Configuration settings
│   │   ├── security.py            # Security utilities (JWT, encryption)
│   │   └── celery_app.py          # Celery configuration
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   ├── base.py                # Database session management
│   │   └── migrate.py             # Database migration script
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # User model
│   │   ├── credential.py          # Cloud credential model
│   │   ├── resource.py            # Terraform resource model
│   │   └── resource_inventory.py  # Resource cache models
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py                # User Pydantic schemas
│   │   ├── resource.py            # Resource schemas
│   │   └── dashboard.py           # Dashboard response schemas
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── aws_sync.py            # AWS resource sync service
│   │   ├── azure_sync.py          # Azure resource sync service
│   │   ├── gcp_sync.py            # GCP resource sync service
│   │   ├── terraform_runner.py    # Terraform execution service
│   │   └── cloud_sync.py          # Generic cloud sync utilities
│   │
│   └── tasks/
│       ├── __init__.py
│       ├── sync_tasks.py          # Background sync tasks
│       └── terraform_tasks.py     # Terraform deployment tasks
│
├── requirements.txt               # Python dependencies
├── Dockerfile                     # Docker image definition
└── .env.example                   # Environment variables template
```

---

## 3. Core Components

### 3.1 FastAPI Application (`main.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth, dashboard, inventory, billing, resources, credentials
from app.db.base import engine, Base
from app.models import user, resource, credential, resource_inventory

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Multi-Cloud Orchestrator API",
    description="Enterprise multi-cloud management platform",
    version="1.0.0"
)

# CORS Middleware
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://localhost:3000",  # Alternative frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
app.include_router(inventory.router, prefix="/inventory", tags=["Inventory"])
app.include_router(billing.router, prefix="/billing", tags=["Billing"])
app.include_router(resources.router, prefix="/resources", tags=["Resources"])
app.include_router(credentials.router, prefix="/credentials", tags=["Credentials"])

@app.get("/health")
def health_check():
    return {"status": "ok"}
```

**Key Features:**

- Automatic OpenAPI documentation at `/docs`
- CORS enabled for frontend communication
- Modular router structure
- Health check endpoint

### 3.2 Database Session Management (`db/base.py`)

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/multicloud")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Dependency for route handlers
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Usage in endpoints:**

```python
@router.get("/dashboard/stats")
def get_stats(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    # db is automatically injected
    stats = db.query(ResourceInventory).filter_by(user_id=user.id).all()
    return stats
```

### 3.3 Configuration (`core/config.py`)

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://postgres:postgres@db:5432/multicloud"

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"

    # Cloud Providers
    AWS_REGION: str = "us-east-1"

    class Config:
        env_file = ".env"

settings = Settings()
```

---

## 4. Database Models

### 4.1 User Model (`models/user.py`)

```python
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from app.db.base import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    credentials = relationship("Credential", back_populates="user", cascade="all, delete-orphan")
    resources = relationship("Resource", back_populates="user", cascade="all, delete-orphan")
    inventory = relationship("ResourceInventory", back_populates="user", cascade="all, delete-orphan")
```

### 4.2 Resource Inventory Model (`models/resource_inventory.py`)

```python
class ResourceInventory(Base):
    """Cached cloud resources from AWS/Azure/GCP"""
    __tablename__ = "resource_inventory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Resource identification
    resource_id = Column(String, unique=True, index=True)  # Cloud provider resource ID
    resource_name = Column(String, index=True)
    resource_type = Column(String, index=True)  # 'vm', 'storage', 'network'

    # Provider info
    provider = Column(String, index=True)  # 'aws', 'azure', 'gcp'
    region = Column(String, index=True)

    # Status
    status = Column(String, index=True)  # 'running', 'stopped', 'terminated'

    # Metadata (JSON)
    metadata = Column(JSON)  # Provider-specific details

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    last_synced = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="inventory")
```

**Metadata Structure:**

```json
{
  "instance_type": "t3.medium",
  "public_ip": "54.123.45.67",
  "private_ip": "10.0.1.25",
  "vpc_id": "vpc-abc123",
  "subnet_id": "subnet-xyz789",
  "security_groups": ["sg-web-server"],
  "tags": {
    "Environment": "production",
    "Team": "backend"
  },
  "launch_time": "2024-01-15T10:30:00Z",
  "cost_per_hour": 0.0416
}
```

### 4.3 Cost Data Model

```python
class CostData(Base):
    """Billing data from cloud providers"""
    __tablename__ = "cost_data"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    provider = Column(String, index=True)
    service = Column(String, index=True)  # 'compute', 'storage', 'network'
    resource_id = Column(String, nullable=True)

    cost = Column(Float)
    currency = Column(String, default="USD")

    # Time period
    date = Column(Date, index=True)
    billing_period = Column(String)  # '2024-01', '2024-02'

    # Metadata
    metadata = Column(JSON)

    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
```

### 4.4 Provider Health Model

```python
class ProviderHealth(Base):
    """Track cloud provider API health"""
    __tablename__ = "provider_health"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    provider = Column(String, index=True)
    status = Column(String)  # 'healthy', 'degraded', 'error'
    response_time_ms = Column(Integer)
    error_message = Column(String, nullable=True)

    last_check = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")
```

---

## 5. API Endpoints

### 5.1 Authentication API (`api/endpoints/auth.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.security import create_access_token, verify_password, get_password_hash
from app.db.base import get_db
from app.models.user import User
from app.schemas.user import UserCreate, UserResponse, Token

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/signup", response_model=UserResponse)
def signup(user_data: UserCreate, db: Session = Depends(get_db)):
    """Create new user account"""
    # Check if user exists
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user
    user = User(
        email=user_data.email,
        hashed_password=get_password_hash(user_data.password),
        full_name=user_data.full_name
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return user

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Login and get access token"""
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user info"""
    return current_user
```

### 5.2 Dashboard API (`api/endpoints/dashboard.py`)

```python
@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get comprehensive dashboard statistics"""

    # Total resources
    total_resources = db.query(ResourceInventory).filter_by(user_id=current_user.id).count()

    # Active VMs
    active_vms = db.query(ResourceInventory).filter_by(
        user_id=current_user.id,
        resource_type='vm',
        status='running'
    ).count()

    # Total storage
    total_storage = db.query(ResourceInventory).filter_by(
        user_id=current_user.id,
        resource_type='storage'
    ).count()

    # Estimated monthly cost
    current_month = datetime.now().strftime('%Y-%m')
    monthly_cost = db.query(func.sum(CostData.cost)).filter(
        CostData.user_id == current_user.id,
        CostData.billing_period == current_month
    ).scalar() or 0.0

    # Provider breakdown
    provider_breakdown = db.query(
        ResourceInventory.provider,
        func.count(ResourceInventory.id).label('count')
    ).filter_by(user_id=current_user.id).group_by(ResourceInventory.provider).all()

    # Cost by provider
    cost_by_provider = db.query(
        CostData.provider,
        func.sum(CostData.cost).label('cost')
    ).filter(
        CostData.user_id == current_user.id,
        CostData.billing_period == current_month
    ).group_by(CostData.provider).all()

    # Provider health
    provider_health = db.query(ProviderHealth).filter_by(
        user_id=current_user.id
    ).order_by(ProviderHealth.last_check.desc()).limit(3).all()

    # Recent activity
    recent_activity = db.query(ResourceInventory).filter_by(
        user_id=current_user.id
    ).order_by(ResourceInventory.last_synced.desc()).limit(10).all()

    return DashboardStatsResponse(
        total_resources=total_resources,
        active_vms=active_vms,
        total_storage=total_storage,
        estimated_monthly_cost=monthly_cost,
        provider_breakdown=[
            {"provider": p.provider, "count": p.count}
            for p in provider_breakdown
        ],
        cost_by_provider=[
            {"provider": c.provider, "cost": float(c.cost)}
            for c in cost_by_provider
        ],
        provider_health=[
            {
                "provider": h.provider,
                "status": h.status,
                "response_time_ms": h.response_time_ms,
                "last_check": h.last_check.isoformat(),
                "error_message": h.error_message
            }
            for h in provider_health
        ],
        recent_activity=[
            {
                "resource_name": r.resource_name,
                "provider": r.provider,
                "type": r.resource_type,
                "status": r.status,
                "region": r.region,
                "last_synced": r.last_synced.isoformat()
            }
            for r in recent_activity
        ],
        last_updated=datetime.utcnow().isoformat()
    )

@router.post("/sync/trigger")
def trigger_manual_sync(
    current_user: User = Depends(get_current_user)
):
    """Trigger manual resource sync"""
    from app.tasks.sync_tasks import sync_user_resources

    # Enqueue Celery task
    sync_user_resources.delay(current_user.id)

    return {"message": "Sync triggered successfully"}
```

### 5.3 Inventory API (`api/endpoints/inventory.py`)

```python
@router.get("/vms", response_model=List[VMResponse])
def list_vms(
    provider: Optional[str] = None,
    region: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """List all VMs with optional filtering"""

    query = db.query(ResourceInventory).filter_by(
        user_id=current_user.id,
        resource_type='vm'
    )

    if provider:
        query = query.filter_by(provider=provider)
    if region:
        query = query.filter_by(region=region)
    if status:
        query = query.filter_by(status=status)

    vms = query.offset(skip).limit(limit).all()

    return vms

@router.get("/{resource_id}", response_model=ResourceDetailResponse)
def get_resource_detail(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get detailed information about a specific resource"""

    resource = db.query(ResourceInventory).filter_by(
        id=resource_id,
        user_id=current_user.id
    ).first()

    if not resource:
        raise HTTPException(status_code=404, detail="Resource not found")

    return resource
```

---

## 6. Services

### 6.1 AWS Sync Service (`services/aws_sync.py`)

```python
import boto3
from typing import List, Dict
from app.models.resource_inventory import ResourceInventory
from app.models.credential import Credential
from sqlalchemy.orm import Session

class AWSSync:
    def __init__(self, credentials: Credential):
        self.ec2_client = boto3.client(
            'ec2',
            aws_access_key_id=credentials.access_key,
            aws_secret_access_key=credentials.secret_key,
            region_name=credentials.region or 'us-east-1'
        )
        self.s3_client = boto3.client('s3', ...)
        self.cost_client = boto3.client('ce', ...)  # Cost Explorer

    def sync_ec2_instances(self, db: Session, user_id: int) -> List[ResourceInventory]:
        """Fetch and sync EC2 instances"""
        response = self.ec2_client.describe_instances()

        resources = []
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                resource = ResourceInventory(
                    user_id=user_id,
                    resource_id=instance['InstanceId'],
                    resource_name=self._get_instance_name(instance),
                    resource_type='vm',
                    provider='aws',
                    region=instance['Placement']['AvailabilityZone'][:-1],
                    status=instance['State']['Name'],
                    metadata={
                        'instance_type': instance['InstanceType'],
                        'public_ip': instance.get('PublicIpAddress'),
                        'private_ip': instance.get('PrivateIpAddress'),
                        'vpc_id': instance.get('VpcId'),
                        'subnet_id': instance.get('SubnetId'),
                        'security_groups': [sg['GroupId'] for sg in instance.get('SecurityGroups', [])],
                        'launch_time': instance['LaunchTime'].isoformat(),
                        'tags': {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
                    }
                )

                # Upsert to database
                existing = db.query(ResourceInventory).filter_by(
                    resource_id=resource.resource_id
                ).first()

                if existing:
                    for key, value in resource.__dict__.items():
                        if not key.startswith('_'):
                            setattr(existing, key, value)
                else:
                    db.add(resource)

                resources.append(resource)

        db.commit()
        return resources

    def sync_s3_buckets(self, db: Session, user_id: int):
        """Fetch and sync S3 buckets"""
        response = self.s3_client.list_buckets()

        for bucket in response['Buckets']:
            # Get bucket location
            location = self.s3_client.get_bucket_location(Bucket=bucket['Name'])
            region = location['LocationConstraint'] or 'us-east-1'

            resource = ResourceInventory(
                user_id=user_id,
                resource_id=f"s3-{bucket['Name']}",
                resource_name=bucket['Name'],
                resource_type='storage',
                provider='aws',
                region=region,
                status='active',
                metadata={
                    'creation_date': bucket['CreationDate'].isoformat(),
                    'bucket_type': 's3'
                }
            )

            # Upsert logic...
            db.add(resource)

        db.commit()

    def get_cost_data(self, db: Session, user_id: int, start_date: str, end_date: str):
        """Fetch cost data from AWS Cost Explorer"""
        response = self.cost_client.get_cost_and_usage(
            TimePeriod={'Start': start_date, 'End': end_date},
            Granularity='DAILY',
            Metrics=['UnblendedCost'],
            GroupBy=[
                {'Type': 'DIMENSION', 'Key': 'SERVICE'},
            ]
        )

        # Process and store cost data...
```

### 6.2 Terraform Runner Service (`services/terraform_runner.py`)

```python
import subprocess
import os
import json
from pathlib import Path

class TerraformRunner:
    def __init__(self, working_dir: str):
        self.working_dir = Path(working_dir)
        self.working_dir.mkdir(parents=True, exist_ok=True)

    def init(self) -> Dict:
        """Run terraform init"""
        result = subprocess.run(
            ['terraform', 'init'],
            cwd=self.working_dir,
            capture_output=True,
            text=True
        )

        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr
        }

    def plan(self) -> Dict:
        """Run terraform plan"""
        result = subprocess.run(
            ['terraform', 'plan', '-out=tfplan'],
            cwd=self.working_dir,
            capture_output=True,
            text=True
        )

        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr
        }

    def apply(self) -> Dict:
        """Run terraform apply"""
        result = subprocess.run(
            ['terraform', 'apply', '-auto-approve', 'tfplan'],
            cwd=self.working_dir,
            capture_output=True,
            text=True
        )

        # Get outputs
        if result.returncode == 0:
            output_result = subprocess.run(
                ['terraform', 'output', '-json'],
                cwd=self.working_dir,
                capture_output=True,
                text=True
            )
            outputs = json.loads(output_result.stdout) if output_result.returncode == 0 else {}
        else:
            outputs = {}

        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr,
            'outputs': outputs
        }

    def destroy(self) -> Dict:
        """Run terraform destroy"""
        result = subprocess.run(
            ['terraform', 'destroy', '-auto-approve'],
            cwd=self.working_dir,
            capture_output=True,
            text=True
        )

        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
```

---

## 7. Middleware

### 7.1 CORS Middleware

Already configured in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 7.2 Authentication Middleware

Implemented via FastAPI dependencies:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    return user
```

---

## 8. Authentication

### 8.1 JWT Token Generation

```python
from jose import jwt
from datetime import datetime, timedelta

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=30)

    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

    return encoded_jwt
```

### 8.2 Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
```

---

## 9. Error Handling

### 9.1 Custom Exception Handlers

```python
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )
```

### 9.2 HTTP Exceptions

```python
from fastapi import HTTPException

# 404 Not Found
raise HTTPException(status_code=404, detail="Resource not found")

# 401 Unauthorized
raise HTTPException(
    status_code=401,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"}
)

# 403 Forbidden
raise HTTPException(status_code=403, detail="Not enough permissions")

# 400 Bad Request
raise HTTPException(status_code=400, detail="Invalid request data")
```

---

## Summary

The backend is a **production-ready FastAPI application** with:

- ✅ RESTful API design
- ✅ JWT authentication
- ✅ Database ORM with SQLAlchemy
- ✅ Background task processing with Celery
- ✅ Cloud provider integrations (AWS, Azure, GCP)
- ✅ Terraform execution engine
- ✅ Comprehensive error handling
- ✅ Automatic API documentation

**Next:** See [API.md](./API.md) for complete API reference.
