"""
Shared API dependencies: database session, current user, RBAC enforcement.
"""
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.db.base import SessionLocal
from app.core.security import verify_token
from app.models.estate import User

security_scheme = HTTPBearer()


# ──────────────────────────────────────────────
# DATABASE SESSION
# ──────────────────────────────────────────────
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ──────────────────────────────────────────────
# CURRENT USER (from JWT)
# ──────────────────────────────────────────────
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security_scheme),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    payload = verify_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing user_id",
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if user.is_banned:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Account banned: {user.ban_reason or 'Contact support'}",
        )

    return user


# ──────────────────────────────────────────────
# RBAC: require specific PRODUCT roles
# ──────────────────────────────────────────────
def require_role(*allowed_roles: str):
    """
    Dependency that ensures current user has one of the specified product roles.
    Usage: Depends(require_role("client", "contractor"))
    """
    def _check(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient role. Required: {', '.join(allowed_roles)}",
            )
        return current_user
    return _check


# ──────────────────────────────────────────────
# RBAC: client or elevated system role
# ──────────────────────────────────────────────
def require_client_or_admin(current_user: User = Depends(get_current_user)):
    if current_user.role != "client" and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Client access required",
        )
    return current_user


# ──────────────────────────────────────────────
# RBAC: require specific SYSTEM roles (admin, moderator)
# ──────────────────────────────────────────────
def require_system_role(*allowed_roles: str):
    """
    Dependency that ensures current user has one of the specified system roles.
    Usage: Depends(require_system_role("admin", "moderator"))
    """
    def _check(current_user: User = Depends(get_current_user)):
        user_system_role = current_user.system_role or "user"
        if user_system_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient access level. Required: {', '.join(allowed_roles)}",
            )
        return current_user
    return _check


# ──────────────────────────────────────────────
# RBAC: admin only shortcut
# ──────────────────────────────────────────────
def require_admin(current_user: User = Depends(get_current_user)):
    if (current_user.system_role or "user") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


# ──────────────────────────────────────────────
# RBAC: moderator or admin shortcut
# ──────────────────────────────────────────────
def require_moderator(current_user: User = Depends(get_current_user)):
    if (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Moderator or admin access required",
        )
    return current_user
