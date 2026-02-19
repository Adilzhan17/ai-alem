"""
Audit log service — IMMUTABLE append-only log.
Every state-changing action in the system MUST call log_action().
"""
from datetime import datetime
from typing import Any, Optional, Dict
from sqlalchemy.orm import Session

from app.models.estate import AuditLog, User


def log_action(
    db: Session,
    *,
    actor: User,
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    old_value: Optional[Dict[str, Any]] = None,
    new_value: Optional[Dict[str, Any]] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> AuditLog:
    """
    Create an immutable audit log entry.

    Args:
        db: SQLAlchemy session
        actor: The user performing the action
        action: e.g. "listing.create", "user.ban", "moderation.approve"
        entity_type: e.g. "listing", "user", "project"
        entity_id: ID of the affected entity
        old_value: JSON snapshot of entity before change (None for create)
        new_value: JSON snapshot of entity after change (None for delete)
        metadata: Extra context (reason, IP address, etc.)
    """
    entry = AuditLog(
        actor_id=actor.id,
        actor_email=actor.email,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        old_value=old_value,
        new_value=new_value,
        metadata_json=metadata,
        created_at=datetime.utcnow(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def listing_to_dict(listing) -> dict:
    """Snapshot a listing for audit log storage."""
    return {
        "id": listing.id,
        "title": listing.title,
        "city": listing.city,
        "district": listing.district,
        "price_kzt": listing.price_kzt,
        "rooms": listing.rooms,
        "area_sqm": listing.area_sqm,
        "status": listing.status,
        "owner_id": listing.owner_id,
    }


def user_to_dict(user) -> dict:
    """Snapshot a user for audit log storage."""
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "system_role": user.system_role,
        "is_banned": user.is_banned,
        "is_verified": user.is_verified,
    }


def project_to_dict(project) -> dict:
    """Snapshot a project for audit log storage."""
    return {
        "id": project.id,
        "title": project.title,
        "status": project.status,
        "budget_total": project.budget_total,
        "owner_id": project.owner_id,
    }


def estimate_to_dict(estimate) -> dict:
    """Snapshot an estimate for audit log storage."""
    return {
        "id": estimate.id,
        "project_id": estimate.project_id,
        "listing_id": estimate.listing_id,
        "version": estimate.version,
        "tier": estimate.tier,
        "total_cost": estimate.total_cost,
        "owner_id": estimate.owner_id,
    }
