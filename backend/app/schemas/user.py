from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None
    job_profile: Optional[str] = None
    organization: Optional[str] = None
    phone_number: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    is_active: bool
    two_factor_enabled: Optional[bool] = False
    sso_provider: Optional[str] = None
    last_password_change: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    job_profile: Optional[str] = None
    organization: Optional[str] = None
    phone_number: Optional[str] = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


class TwoFactorRequest(BaseModel):
    enabled: bool


class TwoFactorSetupResponse(BaseModel):
    secret: str
    qr_code: str
    backup_codes: list[str]


class TwoFactorVerifyRequest(BaseModel):
    token: str


class SSOLoginResponse(BaseModel):
    access_token: str
    token_type: str
    is_new_user: bool
