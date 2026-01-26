from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext
import os

ACCESS_TOKEN_EXPIRE_MINUTES = 30
ALGORITHM = "HS256"
SECRET_KEY = os.getenv("SECRET_KEY", "super-secret-key-change-this-in-prod")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(subject: Union[str, Any], expires_delta: timedelta = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- Encryption for Cloud Credentials ---
from cryptography.fernet import Fernet
import base64
import hashlib

# Derive a 32-byte base64 key from the SECRET_KEY for Fernet
def _get_fernet_key() -> bytes:
    key = hashlib.sha256(SECRET_KEY.encode()).digest()
    return base64.urlsafe_b64encode(key)

_fernet = Fernet(_get_fernet_key())

def encrypt_data(data: str) -> str:
    """Encrypts a string and returns a base64 encoded string."""
    return _fernet.encrypt(data.encode()).decode()

def decrypt_data(data: str) -> str:
    """Decrypts a base64 encoded string and returns the original string."""
    return _fernet.decrypt(data.encode()).decode()
