"""
Audit Log — read-only, admin/moderator only.
"""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.api.deps import get_db, require_moderator
from app.models.estate import AuditLog, User

router = APIRouter()

@router.get("")
def list_audit_log(
    actor_id: Optional[int] = None,
    action: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    q = db.query(AuditLog)
    if actor_id: q = q.filter(AuditLog.actor_id == actor_id)
    if action: q = q.filter(AuditLog.action.ilike(f"%{action}%"))
    if entity_type: q = q.filter(AuditLog.entity_type == entity_type)
    if entity_id: q = q.filter(AuditLog.entity_id == entity_id)

    total = q.count()
    entries = q.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [{
            "id": e.id,
            "actor_id": e.actor_id,
            "actor_email": e.actor_email,
            "action": e.action,
            "entity_type": e.entity_type,
            "entity_id": e.entity_id,
            "old_value": e.old_value,
            "new_value": e.new_value,
            "metadata": e.metadata_json,
            "created_at": e.created_at.isoformat() if e.created_at else None,
        } for e in entries]
    }

@router.get("/{entry_id}")
def get_audit_entry(entry_id: int, db: Session = Depends(get_db),
                    current_user: User = Depends(require_moderator)):
    e = db.query(AuditLog).filter(AuditLog.id == entry_id).first()
    if not e:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Not found")
    return {
        "id": e.id, "actor_id": e.actor_id, "actor_email": e.actor_email,
        "action": e.action, "entity_type": e.entity_type, "entity_id": e.entity_id,
        "old_value": e.old_value, "new_value": e.new_value,
        "metadata": e.metadata_json,
        "created_at": e.created_at.isoformat() if e.created_at else None,
    }
