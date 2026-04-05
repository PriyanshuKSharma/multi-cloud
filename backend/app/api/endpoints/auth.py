from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse
import os
import secrets

import requests
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.base import get_db
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    SubscriptionPlanUpdate,
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
from app.services.subscription import (
    DEFAULT_SUBSCRIPTION_PLAN,
    enforce_plan_change_allowed,
    get_user_subscription_plan,
    normalize_subscription_plan,
    parse_subscription_plan,
)

router = APIRouter()

SSO_STATE_EXPIRE_MINUTES = 10
DEFAULT_FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173").strip() or "http://localhost:5173"


def _serialize_user(user: User) -> UserResponse:
    return UserResponse(
        id=user.id,
        email=user.email,
        full_name=user.full_name,
        job_profile=user.job_profile,
        organization=user.organization,
        phone_number=user.phone_number,
        is_active=user.is_active,
        two_factor_enabled=user.two_factor_enabled,
        sso_provider=user.sso_provider,
        subscription_plan=get_user_subscription_plan(user),
        last_password_change=user.last_password_change,
    )


def _build_default_frontend_redirect() -> str:
    parsed = urlparse(DEFAULT_FRONTEND_ORIGIN)
    if parsed.scheme in {"http", "https"} and parsed.netloc:
        path = parsed.path.rstrip("/") or "/login"
        if path == "/":
            path = "/login"
        return urlunparse((parsed.scheme, parsed.netloc, path, "", "", ""))
    return "http://localhost:5173/login"


def _allowed_frontend_origins() -> List[str]:
    origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    }

    for candidate in [DEFAULT_FRONTEND_ORIGIN]:
        parsed = urlparse(candidate)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            origins.add(f"{parsed.scheme}://{parsed.netloc}")

    cors_origins = os.getenv("CORS_ORIGINS", "")
    for candidate in cors_origins.split(","):
        candidate = candidate.strip()
        if not candidate:
            continue
        parsed = urlparse(candidate)
        if parsed.scheme in {"http", "https"} and parsed.netloc:
            origins.add(f"{parsed.scheme}://{parsed.netloc}")

    return sorted(origins)


def _normalize_frontend_redirect(frontend_redirect: Optional[str]) -> str:
    if not frontend_redirect:
        return _build_default_frontend_redirect()

    redirect = frontend_redirect.strip()
    parsed = urlparse(redirect)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise HTTPException(status_code=400, detail="frontend_redirect must be an absolute URL")

    redirect_origin = f"{parsed.scheme}://{parsed.netloc}"
    if redirect_origin not in _allowed_frontend_origins():
        raise HTTPException(status_code=400, detail="frontend_redirect origin is not allowed")

    safe_path = parsed.path or "/login"
    return urlunparse((parsed.scheme, parsed.netloc, safe_path, "", parsed.query, ""))


def _append_query_params(url: str, params: Dict[str, str]) -> str:
    parsed = urlparse(url)
    query = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query.update({key: value for key, value in params.items() if value})
    return urlunparse((parsed.scheme, parsed.netloc, parsed.path, parsed.params, urlencode(query), parsed.fragment))


def _get_sso_provider_config(provider: str) -> Dict[str, str]:
    provider = provider.lower()

    if provider == "google":
        return {
            "label": "Google",
            "client_id": os.getenv("GOOGLE_SSO_CLIENT_ID", "").strip(),
            "client_secret": os.getenv("GOOGLE_SSO_CLIENT_SECRET", "").strip(),
            "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
            "token_url": "https://oauth2.googleapis.com/token",
            "userinfo_url": "https://openidconnect.googleapis.com/v1/userinfo",
            "scope": "openid email profile",
        }

    if provider == "microsoft":
        tenant = os.getenv("MICROSOFT_SSO_TENANT_ID", "common").strip() or "common"
        return {
            "label": "Microsoft",
            "client_id": os.getenv("MICROSOFT_SSO_CLIENT_ID", "").strip(),
            "client_secret": os.getenv("MICROSOFT_SSO_CLIENT_SECRET", "").strip(),
            "authorize_url": f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/authorize",
            "token_url": f"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token",
            "userinfo_url": "https://graph.microsoft.com/oidc/userinfo",
            "scope": "openid profile email",
        }

    if provider == "github":
        return {
            "label": "GitHub",
            "client_id": os.getenv("GITHUB_SSO_CLIENT_ID", "").strip(),
            "client_secret": os.getenv("GITHUB_SSO_CLIENT_SECRET", "").strip(),
            "authorize_url": "https://github.com/login/oauth/authorize",
            "token_url": "https://github.com/login/oauth/access_token",
            "userinfo_url": "https://api.github.com/user",
            "scope": "read:user user:email",
        }

    raise HTTPException(status_code=404, detail="Unsupported SSO provider")


def _ensure_provider_is_configured(provider: str) -> Dict[str, str]:
    config = _get_sso_provider_config(provider)
    if not config.get("client_id") or not config.get("client_secret"):
        raise HTTPException(status_code=400, detail=f"{config['label']} SSO is not configured on the server")
    return config


def _create_sso_state(provider: str, frontend_redirect: str) -> str:
    payload = {
        "provider": provider,
        "frontend_redirect": frontend_redirect,
        "nonce": secrets.token_urlsafe(12),
        "exp": datetime.utcnow() + timedelta(minutes=SSO_STATE_EXPIRE_MINUTES),
    }
    return jwt.encode(payload, security.SECRET_KEY, algorithm=security.ALGORITHM)


def _decode_sso_state(state: str, provider: str) -> Dict[str, Any]:
    try:
        payload = jwt.decode(state, security.SECRET_KEY, algorithms=[security.ALGORITHM])
    except JWTError as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired SSO state") from exc

    if payload.get("provider") != provider:
        raise HTTPException(status_code=400, detail="SSO state provider mismatch")

    frontend_redirect = payload.get("frontend_redirect")
    if not isinstance(frontend_redirect, str) or not frontend_redirect:
        raise HTTPException(status_code=400, detail="SSO state is missing redirect target")

    payload["frontend_redirect"] = _normalize_frontend_redirect(frontend_redirect)
    return payload


def _parse_json_response(response: requests.Response) -> Dict[str, Any]:
    try:
        payload = response.json()
        if isinstance(payload, dict):
            return payload
    except ValueError:
        pass
    return {}


def _exchange_oauth_code(config: Dict[str, str], code: str, redirect_uri: str) -> str:
    payload = {
        "grant_type": "authorization_code",
        "client_id": config["client_id"],
        "client_secret": config["client_secret"],
        "code": code,
        "redirect_uri": redirect_uri,
    }
    headers = {"Accept": "application/json"}

    response = requests.post(config["token_url"], data=payload, headers=headers, timeout=20)
    token_payload = _parse_json_response(response)
    if response.status_code >= 400:
        detail = token_payload.get("error_description") or token_payload.get("error") or response.text
        raise HTTPException(status_code=400, detail=f"SSO token exchange failed: {detail}")

    access_token = token_payload.get("access_token")
    if not access_token:
        raise HTTPException(status_code=400, detail="SSO token exchange did not return an access token")

    return str(access_token)


def _fetch_userinfo_google(config: Dict[str, str], access_token: str) -> Tuple[str, str]:
    response = requests.get(
        config["userinfo_url"],
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        timeout=20,
    )
    payload = _parse_json_response(response)
    if response.status_code >= 400:
        detail = payload.get("error_description") or payload.get("error") or response.text
        raise HTTPException(status_code=400, detail=f"Google userinfo fetch failed: {detail}")

    email = str(payload.get("email") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account did not provide an email address")

    full_name = str(payload.get("name") or payload.get("given_name") or email.split("@")[0]).strip()
    return email, full_name


def _fetch_userinfo_microsoft(config: Dict[str, str], access_token: str) -> Tuple[str, str]:
    response = requests.get(
        config["userinfo_url"],
        headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
        timeout=20,
    )
    payload = _parse_json_response(response)
    if response.status_code >= 400:
        detail = payload.get("error_description") or payload.get("error") or response.text
        raise HTTPException(status_code=400, detail=f"Microsoft userinfo fetch failed: {detail}")

    email = str(payload.get("email") or payload.get("preferred_username") or "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Microsoft account did not provide an email address")

    full_name = str(payload.get("name") or email.split("@")[0]).strip()
    return email, full_name


def _fetch_userinfo_github(config: Dict[str, str], access_token: str) -> Tuple[str, str]:
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    user_response = requests.get(config["userinfo_url"], headers=headers, timeout=20)
    user_payload = _parse_json_response(user_response)
    if user_response.status_code >= 400:
        detail = user_payload.get("message") or user_response.text
        raise HTTPException(status_code=400, detail=f"GitHub user profile fetch failed: {detail}")

    email = str(user_payload.get("email") or "").strip().lower()
    if not email:
        email_response = requests.get("https://api.github.com/user/emails", headers=headers, timeout=20)
        email_payload = email_response.json() if email_response.status_code < 500 else []
        if email_response.status_code >= 400 or not isinstance(email_payload, list):
            raise HTTPException(status_code=400, detail="GitHub account does not expose email. Enable a public/primary email.")

        primary_verified = next(
            (
                item.get("email")
                for item in email_payload
                if isinstance(item, dict) and item.get("primary") and item.get("verified") and item.get("email")
            ),
            None,
        )
        verified_any = next(
            (
                item.get("email")
                for item in email_payload
                if isinstance(item, dict) and item.get("verified") and item.get("email")
            ),
            None,
        )
        fallback_any = next(
            (item.get("email") for item in email_payload if isinstance(item, dict) and item.get("email")),
            None,
        )

        email = str(primary_verified or verified_any or fallback_any or "").strip().lower()

    if not email:
        raise HTTPException(status_code=400, detail="GitHub account did not provide an email address")

    full_name = str(user_payload.get("name") or user_payload.get("login") or email.split("@")[0]).strip()
    return email, full_name


def _fetch_sso_profile(provider: str, config: Dict[str, str], access_token: str) -> Tuple[str, str]:
    if provider == "google":
        return _fetch_userinfo_google(config, access_token)
    if provider == "microsoft":
        return _fetch_userinfo_microsoft(config, access_token)
    if provider == "github":
        return _fetch_userinfo_github(config, access_token)
    raise HTTPException(status_code=404, detail="Unsupported SSO provider")


def _get_or_create_sso_user(db: Session, email: str, full_name: str) -> User:
    normalized_email = email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()
    if user:
        if full_name and not user.full_name:
            user.full_name = full_name
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    random_password = secrets.token_urlsafe(32)
    user = User(
        email=normalized_email,
        hashed_password=security.get_password_hash(random_password),
        full_name=full_name or normalized_email.split("@")[0],
        two_factor_enabled=False,
        subscription_plan=DEFAULT_SUBSCRIPTION_PLAN,
        last_password_change=datetime.utcnow(),
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.get("/sso/providers")
def list_sso_providers():
    providers = []
    for provider_id in ["google", "microsoft", "github"]:
        config = _get_sso_provider_config(provider_id)
        providers.append(
            {
                "id": provider_id,
                "label": config["label"],
                "configured": bool(config.get("client_id") and config.get("client_secret")),
            }
        )
    return {"providers": providers}


@router.get("/sso/{provider}/start")
def start_sso(
    provider: str,
    request: Request,
    frontend_redirect: Optional[str] = Query(None),
):
    provider = provider.lower()
    config = _ensure_provider_is_configured(provider)
    target_frontend_redirect = _normalize_frontend_redirect(frontend_redirect)

    callback_uri = str(request.url_for("sso_callback", provider=provider))
    state = _create_sso_state(provider, target_frontend_redirect)

    params = {
        "client_id": config["client_id"],
        "redirect_uri": callback_uri,
        "response_type": "code",
        "scope": config["scope"],
        "state": state,
    }

    if provider in {"google", "microsoft"}:
        params["prompt"] = "select_account"

    authorization_url = f"{config['authorize_url']}?{urlencode(params)}"
    return RedirectResponse(url=authorization_url, status_code=302)


@router.get("/sso/{provider}/callback", name="sso_callback")
def sso_callback(
    provider: str,
    request: Request,
    code: Optional[str] = Query(None),
    state: Optional[str] = Query(None),
    error: Optional[str] = Query(None),
    error_description: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    provider = provider.lower()
    frontend_redirect = _build_default_frontend_redirect()

    if state:
        try:
            decoded_state = _decode_sso_state(state, provider)
            frontend_redirect = str(decoded_state["frontend_redirect"])
        except HTTPException:
            frontend_redirect = _build_default_frontend_redirect()

    if error:
        message = error_description or error or f"{provider.capitalize()} sign-in was cancelled"
        return RedirectResponse(
            url=_append_query_params(frontend_redirect, {"sso_error": message}),
            status_code=302,
        )

    if not code or not state:
        return RedirectResponse(
            url=_append_query_params(frontend_redirect, {"sso_error": "Missing SSO callback parameters"}),
            status_code=302,
        )

    try:
        decoded_state = _decode_sso_state(state, provider)
        frontend_redirect = str(decoded_state["frontend_redirect"])

        config = _ensure_provider_is_configured(provider)
        callback_uri = str(request.url_for("sso_callback", provider=provider))

        provider_access_token = _exchange_oauth_code(config, code, callback_uri)
        email, full_name = _fetch_sso_profile(provider, config, provider_access_token)
        user = _get_or_create_sso_user(db, email, full_name)

        access_token_expires = timedelta(minutes=security.ACCESS_TOKEN_EXPIRE_MINUTES)
        app_access_token = security.create_access_token(user.id, expires_delta=access_token_expires)

        return RedirectResponse(
            url=_append_query_params(
                frontend_redirect,
                {
                    "sso_token": app_access_token,
                    "sso_provider": provider,
                },
            ),
            status_code=302,
        )
    except HTTPException as exc:
        return RedirectResponse(
            url=_append_query_params(frontend_redirect, {"sso_error": str(exc.detail)}),
            status_code=302,
        )
    except Exception:
        return RedirectResponse(
            url=_append_query_params(frontend_redirect, {"sso_error": f"{provider.capitalize()} sign-in failed"}),
            status_code=302,
        )


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
        subscription_plan=normalize_subscription_plan(user_in.subscription_plan),
        last_password_change=datetime.utcnow(),
        is_superuser=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return _serialize_user(user)


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
    return _serialize_user(current_user)


@router.put("/me", response_model=UserResponse)
def update_profile(
    profile_in: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
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
    return _serialize_user(current_user)


@router.post("/subscription-plan", response_model=UserResponse)
def update_subscription_plan(
    payload: SubscriptionPlanUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserResponse:
    requested_plan = parse_subscription_plan(payload.subscription_plan)
    current_plan = get_user_subscription_plan(current_user)

    if requested_plan == current_plan:
        # Ensure canonical storage (e.g. aliases) without forcing clients to refetch.
        if (current_user.subscription_plan or "").strip().lower() != requested_plan:
            current_user.subscription_plan = requested_plan
            db.add(current_user)
            db.commit()
            db.refresh(current_user)
        return _serialize_user(current_user)

    enforce_plan_change_allowed(db, current_user, requested_plan)
    current_user.subscription_plan = requested_plan
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)


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
) -> UserResponse:
    current_user.two_factor_enabled = payload.enabled
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return _serialize_user(current_user)


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
