from jose import jwt
from datetime import datetime, timedelta
import os

SECRET_KEY = "super-secret-key-change-this-in-prod" # Match security.py default
ALGORITHM = "HS256"

def create_access_token(subject: str):
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode = {"exp": expire, "sub": str(subject)}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

token = create_access_token("1")
print(token)
