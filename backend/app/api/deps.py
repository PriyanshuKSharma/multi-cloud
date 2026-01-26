from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.models.user import User
from app.core import security
from app.schemas.user import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, security.SECRET_KEY, algorithms=[security.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(email=username)
    except JWTError:
        raise credentials_exception
        
    # Here 'sub' stored as user.id (integer) in login, but schema expects email?
    # Wait, in security.py create_access_token used str(user.id).
    # So username is actually user_id string.
    
    try:
        user_id = int(username)
        user = db.query(User).filter(User.id == user_id).first()
    except ValueError:
        user = None

    if user is None:
        raise credentials_exception
    return user
