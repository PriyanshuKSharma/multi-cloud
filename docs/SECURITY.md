# Security & Secrets Management Documentation

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Credential Encryption](#3-credential-encryption)
4. [Environment Variables](#4-environment-variables)
5. [API Security](#5-api-security)
6. [Database Security](#6-database-security)
7. [Best Practices](#7-best-practices)

---

## 1. Overview

The platform implements **enterprise-grade security** for:

- User authentication (JWT)
- Cloud credential encryption (AES-256)
- Secure API communication
- Database security
- Secret management

**Security Layers:**

```
┌─────────────────────────────────────────────────────────────┐
│                    USER LAYER                               │
│  • JWT Authentication                                        │
│  • Password hashing (bcrypt)                                 │
│  • Session management                                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                 │
│  • HTTPS/TLS encryption                                      │
│  • CORS protection                                           │
│  • Rate limiting                                             │
│  • Input validation (Pydantic)                               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                           │
│  • Credential encryption (AES-256)                           │
│  • Environment variable management                           │
│  • Secret key rotation                                       │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATABASE LAYER                             │
│  • Encrypted connections (SSL)                               │
│  • User isolation (row-level security)                       │
│  • Encrypted credentials at rest                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication

### 2.1 JWT (JSON Web Tokens)

**Token Structure:**

```
Header.Payload.Signature
```

**Example Token:**

```
eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.
eyJzdWIiOiJ1c2VyQGV4YW1wbGUuY29tIiwiZXhwIjoxNzA3NzAwMDAwfQ.
signature_hash_here
```

**Payload:**

```json
{
  "sub": "user@example.com", // Subject (user email)
  "exp": 1707700000, // Expiration timestamp
  "iat": 1707698200 // Issued at timestamp
}
```

### 2.2 Token Generation (`core/security.py`)

```python
from jose import jwt
from datetime import datetime, timedelta
from app.core.config import settings

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Generate JWT access token"""
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt
```

### 2.3 Token Verification

```python
from jose import JWTError, jwt
from fastapi import HTTPException, status

def verify_token(token: str):
    """Verify and decode JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        email: str = payload.get("sub")

        if email is None:
            raise credentials_exception

        return email

    except JWTError:
        raise credentials_exception
```

### 2.4 Password Hashing

```python
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return pwd_context.verify(plain_password, hashed_password)
```

**Example:**

```python
# Register user
hashed_password = get_password_hash("mypassword123")
# Store: $2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5NU7z1zeP4.Oi

# Login
is_valid = verify_password("mypassword123", hashed_password)
# Returns: True
```

---

## 3. Credential Encryption

### 3.1 AES-256 Encryption

Cloud credentials (AWS keys, Azure secrets, GCP service accounts) are encrypted before storage.

**Encryption Flow:**

```
Plain Credential → AES-256 Encryption → Encrypted Blob → Database
                   (with SECRET_KEY)
```

**Decryption Flow:**

```
Database → Encrypted Blob → AES-256 Decryption → Plain Credential
                            (with SECRET_KEY)
```

### 3.2 Implementation (`core/security.py`)

```python
from cryptography.fernet import Fernet
from app.core.config import settings
import base64

def get_encryption_key():
    """Get or generate encryption key"""
    # Use SECRET_KEY from environment
    key = base64.urlsafe_b64encode(settings.SECRET_KEY.encode()[:32].ljust(32, b'0'))
    return key

def encrypt_credential(plain_text: str) -> str:
    """Encrypt credential using AES-256"""
    fernet = Fernet(get_encryption_key())
    encrypted = fernet.encrypt(plain_text.encode())
    return encrypted.decode()

def decrypt_credential(encrypted_text: str) -> str:
    """Decrypt credential"""
    fernet = Fernet(get_encryption_key())
    decrypted = fernet.decrypt(encrypted_text.encode())
    return decrypted.decode()
```

### 3.3 Storing Credentials

```python
from app.models.credential import Credential
from app.core.security import encrypt_credential

# Encrypt before saving
credential = Credential(
    user_id=user.id,
    provider='aws',
    access_key=encrypt_credential(aws_access_key),
    secret_key=encrypt_credential(aws_secret_key),
    region='us-east-1'
)

db.add(credential)
db.commit()
```

### 3.4 Retrieving Credentials

```python
from app.core.security import decrypt_credential

# Decrypt when using
credential = db.query(Credential).filter_by(id=cred_id).first()

aws_access_key = decrypt_credential(credential.access_key)
aws_secret_key = decrypt_credential(credential.secret_key)

# Use with boto3
ec2_client = boto3.client(
    'ec2',
    aws_access_key_id=aws_access_key,
    aws_secret_access_key=aws_secret_key
)
```

---

## 4. Environment Variables

### 4.1 `.env` File Structure

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@db:5432/multicloud

# Security
SECRET_KEY=your-super-secret-key-change-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Celery
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Cloud Providers (optional defaults)
AWS_REGION=us-east-1
AZURE_REGION=eastus
GCP_REGION=us-central1

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_TERRAFORM=true
ENABLE_COST_TRACKING=true

# Logging
LOG_LEVEL=INFO
```

### 4.2 Secret Key Generation

**Generate secure SECRET_KEY:**

```python
import secrets

# Generate 32-byte random key
secret_key = secrets.token_urlsafe(32)
print(secret_key)
# Output: 'Xg8f3kL9mN2pQ5rS7tU1vW4xY6zA0bC3dE5fG8hJ1kL4'
```

**Or using OpenSSL:**

```bash
openssl rand -base64 32
```

### 4.3 Loading Environment Variables

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

---

## 5. API Security

### 5.1 HTTPS/TLS

**Production Configuration (Nginx):**

```nginx
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 5.2 CORS Configuration

```python
from fastapi.middleware.cors import CORSMiddleware

origins = [
    "https://your-domain.com",
    "https://www.your-domain.com",
]

# Development
if settings.ENVIRONMENT == "development":
    origins.extend([
        "http://localhost:5173",
        "http://localhost:3000",
    ])

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
    max_age=3600,
)
```

### 5.3 Rate Limiting

```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/auth/login")
@limiter.limit("5/minute")
def login(request: Request, ...):
    # Login logic
    pass

@app.get("/dashboard/stats")
@limiter.limit("60/minute")
def get_stats(request: Request, ...):
    # Dashboard logic
    pass
```

### 5.4 Input Validation

```python
from pydantic import BaseModel, EmailStr, validator

class UserCreate(BaseModel):
    email: EmailStr  # Validates email format
    password: str
    full_name: str

    @validator('password')
    def password_strength(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

    @validator('full_name')
    def name_not_empty(cls, v):
        if not v.strip():
            raise ValueError('Full name cannot be empty')
        return v
```

---

## 6. Database Security

### 6.1 Connection Security

**SSL Connection:**

```python
DATABASE_URL = "postgresql://user:pass@host:5432/db?sslmode=require"

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "sslmode": "require",
        "sslrootcert": "/path/to/ca-cert.pem"
    }
)
```

### 6.2 User Isolation

**Row-Level Security (RLS):**

```sql
-- Enable RLS on resource_inventory table
ALTER TABLE resource_inventory ENABLE ROW LEVEL SECURITY;

-- Create policy: users can only see their own resources
CREATE POLICY user_isolation_policy ON resource_inventory
    FOR ALL
    TO authenticated_user
    USING (user_id = current_user_id());

-- Function to get current user ID
CREATE FUNCTION current_user_id() RETURNS INTEGER AS $$
    SELECT current_setting('app.current_user_id')::INTEGER;
$$ LANGUAGE SQL STABLE;
```

**Application-Level Isolation:**

```python
# Always filter by user_id
@router.get("/inventory/vms")
def list_vms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Automatic user isolation
    vms = db.query(ResourceInventory).filter_by(
        user_id=current_user.id,  # ← User isolation
        resource_type='vm'
    ).all()

    return vms
```

### 6.3 SQL Injection Prevention

**Use ORM (SQLAlchemy):**

```python
# ✅ SAFE - Parameterized query
vms = db.query(ResourceInventory).filter_by(
    user_id=user_id,
    provider=provider
).all()

# ❌ UNSAFE - String concatenation
query = f"SELECT * FROM resource_inventory WHERE provider = '{provider}'"
db.execute(query)  # Vulnerable to SQL injection!
```

---

## 7. Best Practices

### 7.1 Secret Management Checklist

- ✅ **Never commit secrets to Git**
  - Use `.gitignore` for `.env` files
  - Use environment variables
- ✅ **Rotate secrets regularly**
  - Change SECRET_KEY every 90 days
  - Rotate database passwords
  - Update cloud credentials
- ✅ **Use strong encryption**
  - AES-256 for credentials
  - bcrypt for passwords
  - TLS 1.2+ for connections
- ✅ **Implement least privilege**
  - Cloud IAM roles with minimal permissions
  - Database users with limited access
  - API tokens with scoped permissions

### 7.2 Production Security Checklist

```bash
# 1. Generate strong SECRET_KEY
SECRET_KEY=$(openssl rand -base64 32)

# 2. Enable HTTPS
# - Get SSL certificate (Let's Encrypt)
# - Configure Nginx with TLS 1.2+

# 3. Secure database
# - Enable SSL connections
# - Use strong passwords
# - Restrict network access

# 4. Enable rate limiting
# - Protect against brute force
# - Prevent API abuse

# 5. Regular updates
# - Update dependencies
# - Apply security patches
# - Monitor CVEs

# 6. Logging & monitoring
# - Log authentication attempts
# - Monitor failed logins
# - Alert on suspicious activity

# 7. Backup & recovery
# - Regular database backups
# - Encrypted backups
# - Test recovery procedures
```

### 7.3 Credential Storage Best Practices

**AWS Credentials:**

```python
# ✅ GOOD - Encrypted in database
credential = Credential(
    provider='aws',
    access_key=encrypt_credential(aws_access_key),
    secret_key=encrypt_credential(aws_secret_key)
)

# ❌ BAD - Plain text
credential = Credential(
    provider='aws',
    access_key=aws_access_key,  # Plain text!
    secret_key=aws_secret_key   # Plain text!
)
```

**Azure Credentials:**

```python
# ✅ GOOD - Service principal with minimal permissions
{
    "tenant_id": encrypt_credential(tenant_id),
    "client_id": encrypt_credential(client_id),
    "client_secret": encrypt_credential(client_secret),
    "subscription_id": encrypt_credential(subscription_id)
}
```

**GCP Credentials:**

```python
# ✅ GOOD - Service account with limited scope
{
    "service_account_json": encrypt_credential(json.dumps(sa_json)),
    "project_id": project_id  # Not sensitive
}
```

### 7.4 Security Headers

```python
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.httpsredirect import HTTPSRedirectMiddleware

# Force HTTPS in production
if settings.ENVIRONMENT == "production":
    app.add_middleware(HTTPSRedirectMiddleware)

# Trusted hosts
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["your-domain.com", "*.your-domain.com"]
)

# Security headers
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response
```

---

## Summary

The platform implements **comprehensive security** through:

- ✅ JWT authentication with bcrypt password hashing
- ✅ AES-256 encryption for cloud credentials
- ✅ HTTPS/TLS for all communications
- ✅ CORS protection and rate limiting
- ✅ Input validation with Pydantic
- ✅ Database SSL connections
- ✅ User isolation at application and database levels
- ✅ SQL injection prevention via ORM
- ✅ Security headers and best practices

**Next:** See [DEPLOYMENT.md](./DEPLOYMENT.md) for production deployment guide.
