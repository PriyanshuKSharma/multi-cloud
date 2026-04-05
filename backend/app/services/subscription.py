from __future__ import annotations

from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.credential import CloudCredential
from app.models.resource import Project
from app.models.user import User

DEFAULT_SUBSCRIPTION_PLAN = "basic"

_PLAN_ALIASES = {
    "starter": "basic",
    "basic": "basic",
    "pro": "pro",
    "professional": "pro",
    "enterprise": "enterprise",
}

_PLAN_LIMITS = {
    "basic": {
        "projects": 5,
        "cloud_accounts": 1,
    },
    "pro": {
        "projects": 25,
        "cloud_accounts": None,
    },
    "enterprise": {
        "projects": None,
        "cloud_accounts": None,
    },
}

_PLAN_LABELS = {
    "basic": "Basic",
    "pro": "Professional",
    "enterprise": "Enterprise",
}


def normalize_subscription_plan(value: object) -> str:
    normalized = str(value or "").strip().lower()
    return _PLAN_ALIASES.get(normalized, DEFAULT_SUBSCRIPTION_PLAN)


def parse_subscription_plan(value: object) -> str:
    """
    Parse and validate a user-supplied subscription plan.

    Unlike normalize_subscription_plan(), this is strict: unknown values raise 400.
    """
    normalized = str(value or "").strip().lower()
    if normalized in _PLAN_ALIASES:
        return _PLAN_ALIASES[normalized]
    allowed = ", ".join(_PLAN_LIMITS.keys())
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=f"subscription_plan must be one of: {allowed}",
    )


def get_user_subscription_plan(user: User) -> str:
    return normalize_subscription_plan(getattr(user, "subscription_plan", None))


def get_plan_limits(plan: str) -> dict[str, Optional[int]]:
    normalized = normalize_subscription_plan(plan)
    return dict(_PLAN_LIMITS[normalized])


def _plan_label(plan: str) -> str:
    normalized = normalize_subscription_plan(plan)
    return _PLAN_LABELS[normalized]


def _limit_error(plan: str, limit: int, resource_label: str) -> HTTPException:
    plan_name = _plan_label(plan)
    return HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=(
            f"{plan_name} plan allows up to {limit} {resource_label}. "
            f"Delete an existing {resource_label[:-1]} or upgrade your plan to add another."
        ),
    )


def enforce_project_limit(db: Session, user: User) -> None:
    plan = get_user_subscription_plan(user)
    limit = get_plan_limits(plan)["projects"]
    if limit is None:
        return

    # Projects do not have an archived/inactive state yet, so enforce against the total count.
    project_count = db.query(Project).filter(Project.user_id == user.id).count()
    if project_count >= limit:
        raise _limit_error(plan, limit, "projects")


def enforce_cloud_account_limit(db: Session, user: User) -> None:
    plan = get_user_subscription_plan(user)
    limit = get_plan_limits(plan)["cloud_accounts"]
    if limit is None:
        return

    account_count = db.query(CloudCredential).filter(CloudCredential.user_id == user.id).count()
    if account_count >= limit:
        raise _limit_error(plan, limit, "cloud accounts")


def enforce_plan_change_allowed(db: Session, user: User, requested_plan: str) -> None:
    """
    Prevent switching to a plan that cannot accommodate current usage.

    This primarily blocks downgrades (e.g., Pro -> Basic) when the user is already above
    the target plan limits. Upgrades should always pass.
    """
    requested = normalize_subscription_plan(requested_plan)
    limits = get_plan_limits(requested)

    project_limit = limits.get("projects")
    if project_limit is not None:
        project_count = db.query(Project).filter(Project.user_id == user.id).count()
        if project_count > project_limit:
            plan_name = _plan_label(requested)
            delta = project_count - project_limit
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Cannot switch to {plan_name} plan while you have {project_count} projects "
                    f"(limit {project_limit}). Delete {delta} project{'s' if delta != 1 else ''} "
                    "or choose a higher plan."
                ),
            )

    account_limit = limits.get("cloud_accounts")
    if account_limit is not None:
        account_count = db.query(CloudCredential).filter(CloudCredential.user_id == user.id).count()
        if account_count > account_limit:
            plan_name = _plan_label(requested)
            delta = account_count - account_limit
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Cannot switch to {plan_name} plan while you have {account_count} cloud accounts "
                    f"(limit {account_limit}). Delete {delta} cloud account{'s' if delta != 1 else ''} "
                    "or choose a higher plan."
                ),
            )
