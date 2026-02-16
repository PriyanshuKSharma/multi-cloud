from datetime import datetime, timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    Token,
    TwoFactorRequest,
    TwoFactorSetupResponse,
    TwoFactorVerifyRequest,
    SSOLoginResponse,
    UserCreate,
    UserProfileUpdate,
    UserResponse,
)
from app.core import security
from app.services.two_factor import TwoFactorService
from app.services.sso import SSOService, oauth

router = APIRouter()

@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(
            status_code=400,
            detail="The user with this username already exists in the system.",
        )
    user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        job_profile=user_in.job_profile,
        organization=user_in.organization,
        phone_number=user_in.phone_number,
        two_factor_enabled=False,
        two_factor_secret=None,
        sso_provider=None,
        last_password_change=datetime.utcnow(),
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login_access_token(
    db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()
) -> Any:
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }

@router.get("/me", response_model=UserResponse)
def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    if profile_in.full_name is not None:
        current_user.full_name = profile_in.full_name
    if profile_in.job_profile is not None:
        current_user.job_profile = profile_in.job_profile
    if profile_in.organization is not None:
        current_user.organization = profile_in.organization
    if profile_in.phone_number is not None:
        current_user.phone_number = profile_in.phone_number

    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/change-password")
def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    if not security.verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect",
        )

    if payload.current_password == payload.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different",
        )

    current_user.hashed_password = security.get_password_hash(payload.new_password)
    current_user.last_password_change = datetime.utcnow()
    db.add(current_user)
    db.commit()
    return {"message": "Password changed successfully"}


@router.post("/two-factor", response_model=UserResponse)
def set_two_factor(
    payload: TwoFactorRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> User:
    current_user.two_factor_enabled = payload.enabled
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return current_user


# ===== 2FA Endpoints =====

@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
def setup_two_factor(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Generate 2FA secret and QR code"""
    if current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is already enabled. Disable it first to reset."
        )
    
    secret = TwoFactorService.generate_secret()
    qr_code = TwoFactorService.generate_qr_code(current_user.email, secret)
    backup_codes = TwoFactorService.get_backup_codes()
    
    # Store secret temporarily (will be confirmed on verification)
    current_user.two_factor_secret = secret
    db.add(current_user)
    db.commit()
    
    return {
        "secret": secret,
        "qr_code": qr_code,
        "backup_codes": backup_codes
    }


@router.post("/2fa/verify")
def verify_two_factor(
    payload: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Verify 2FA token and enable 2FA"""
    if not current_user.two_factor_secret:
        raise HTTPException(
            status_code=400,
            detail="2FA setup not initiated. Call /2fa/setup first."
        )
    
    if not TwoFactorService.verify_token(current_user.two_factor_secret, payload.token):
        raise HTTPException(
            status_code=400,
            detail="Invalid 2FA token"
        )
    
    current_user.two_factor_enabled = True
    db.add(current_user)
    db.commit()
    
    return {"message": "2FA enabled successfully"}


@router.post("/2fa/disable")
def disable_two_factor(
    payload: TwoFactorVerifyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Disable 2FA after token verification"""
    if not current_user.two_factor_enabled:
        raise HTTPException(
            status_code=400,
            detail="2FA is not enabled"
        )
    
    if not TwoFactorService.verify_token(current_user.two_factor_secret, payload.token):
        raise HTTPException(
            status_code=400,
            detail="Invalid 2FA token"
        )
    
    current_user.two_factor_enabled = False
    current_user.two_factor_secret = None
    db.add(current_user)
    db.commit()
    
    return {"message": "2FA disabled successfully"}


@router.post("/login/2fa", response_model=Token)
def login_with_2fa(
    email: str,
    password: str,
    token: str,
    db: Session = Depends(get_db)
) -> dict:
    """Login with 2FA token"""
    user = db.query(User).filter(User.email == email).first()
    if not user or not security.verify_password(password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    if user.two_factor_enabled:
        if not TwoFactorService.verify_token(user.two_factor_secret, token):
            raise HTTPException(status_code=400, detail="Invalid 2FA token")
    
    access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
    return {
        "access_token": security.create_access_token(
            user.id, expires_delta=access_token_expires
        ),
        "token_type": "bearer",
    }


# ===== SSO Endpoints =====

@router.get("/sso/google/login")
async def google_login(request: Request):
    """Redirect to Google OAuth"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)


@router.get("/sso/google/callback")
async def google_callback(request: Request, db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = await SSOService.get_google_user_info(token.get('userinfo'))
        
        email = user_info.get('email')
        google_id = user_info.get('sub')
        
        # Check if user exists
        user = db.query(User).filter(User.email == email).first()
        is_new_user = False
        
        if not user:
            # Create new user
            user = User(
                email=email,
                full_name=user_info.get('name'),
                sso_provider='google',
                sso_id=google_id,
                hashed_password=None,
                two_factor_enabled=False,
                is_superuser=False,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            is_new_user = True
        else:
            # Update SSO info if not set
            if not user.sso_provider:
                user.sso_provider = 'google'
                user.sso_id = google_id
                db.add(user)
                db.commit()
        
        # Generate access token
        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = security.create_access_token(
            user.id, expires_delta=access_token_expires
        )
        
        # Redirect to frontend with token
        frontend_url = "http://localhost:5173"
        redirect_url = f"{frontend_url}/auth/callback?token={access_token}&is_new_user={is_new_user}"
        return RedirectResponse(url=redirect_url)
    
    except Exception as e:
        # Redirect to frontend with error
        frontend_url = "http://localhost:5173"
        error_msg = str(e).replace(' ', '_')
        redirect_url = f"{frontend_url}/login?error={error_msg}"
        return RedirectResponse(url=redirect_url)
