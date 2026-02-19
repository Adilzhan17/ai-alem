"""
Backoffice API — admin/moderator panel endpoints.
Users management, listings overview, complaints, stats.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.api.deps import get_db, require_moderator, require_admin
from app.models.estate import (User, Listing, Project, Estimate, Contractor,
                                Supplier, Complaint, AuditLog, Notification)
from app.services.audit_service import log_action, user_to_dict
from app.services.notification_service import send_notification

router = APIRouter()

# ──────── DASHBOARD STATS ────────
@router.get("/stats")
def dashboard_stats(db: Session = Depends(get_db),
                    current_user: User = Depends(require_moderator)):
    return {
        "users_total": db.query(func.count(User.id)).scalar(),
        "users_by_role": {
            "client": db.query(func.count(User.id)).filter(User.role == "client").scalar(),
            "contractor": db.query(func.count(User.id)).filter(User.role == "contractor").scalar(),
            "supplier": db.query(func.count(User.id)).filter(User.role == "supplier-materials").scalar(),
        },
        "listings_total": db.query(func.count(Listing.id)).scalar(),
        "listings_pending": db.query(func.count(Listing.id)).filter(Listing.status == "pending_review").scalar(),
        "listings_approved": db.query(func.count(Listing.id)).filter(Listing.status == "approved").scalar(),
        "projects_total": db.query(func.count(Project.id)).scalar(),
        "estimates_total": db.query(func.count(Estimate.id)).scalar(),
        "contractors_total": db.query(func.count(Contractor.id)).scalar(),
        "suppliers_total": db.query(func.count(Supplier.id)).scalar(),
        "complaints_open": db.query(func.count(Complaint.id)).filter(Complaint.status == "open").scalar(),
    }

# ──────── USERS MANAGEMENT ────────
@router.get("/users")
def list_users(search: Optional[str] = None, role: Optional[str] = None,
               system_role: Optional[str] = None, is_banned: Optional[bool] = None,
               skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
               db: Session = Depends(get_db), current_user: User = Depends(require_moderator)):
    q = db.query(User)
    if search: q = q.filter((User.email.ilike(f"%{search}%")) | (User.full_name.ilike(f"%{search}%")))
    if role: q = q.filter(User.role == role)
    if system_role: q = q.filter(User.system_role == system_role)
    if is_banned is not None: q = q.filter(User.is_banned == is_banned)
    total = q.count()
    users = q.order_by(desc(User.created_at)).offset(skip).limit(limit).all()
    return {"total": total, "items": [user_to_dict(u) | {
        "company_name": u.company_name, "phone": u.phone,
        "created_at": u.created_at.isoformat() if u.created_at else None,
        "listings_count": db.query(func.count(Listing.id)).filter(Listing.owner_id == u.id).scalar(),
    } for u in users]}

@router.get("/users/{uid}")
def get_user_detail(uid: int, db: Session = Depends(get_db),
                    current_user: User = Depends(require_moderator)):
    u = db.query(User).filter(User.id == uid).first()
    if not u: raise HTTPException(status_code=404, detail="User not found")
    return user_to_dict(u) | {
        "company_name": u.company_name, "phone": u.phone, "ban_reason": u.ban_reason,
        "created_at": u.created_at.isoformat() if u.created_at else None,
    }

class BanAction(BaseModel):
    reason: Optional[str] = None
    unban: bool = False

@router.post("/users/{uid}/ban")
def ban_user(uid: int, body: BanAction, db: Session = Depends(get_db),
             current_user: User = Depends(require_admin)):
    u = db.query(User).filter(User.id == uid).first()
    if not u: raise HTTPException(status_code=404, detail="User not found")
    if u.id == current_user.id: raise HTTPException(status_code=400, detail="Cannot ban yourself")
    old = user_to_dict(u)
    if body.unban:
        u.is_banned = False; u.ban_reason = None
    else:
        u.is_banned = True; u.ban_reason = body.reason or "Banned by admin"
    u.updated_at = datetime.utcnow()
    db.commit(); db.refresh(u)
    log_action(db, actor=current_user,
               action="user.unban" if body.unban else "user.ban",
               entity_type="user", entity_id=u.id,
               old_value=old, new_value=user_to_dict(u),
               metadata={"reason": body.reason})
    return {"detail": "User unbanned" if body.unban else "User banned", "is_banned": u.is_banned}

class SetRoleAction(BaseModel):
    system_role: str  # user, moderator, admin

@router.post("/users/{uid}/set-role")
def set_user_role(uid: int, body: SetRoleAction, db: Session = Depends(get_db),
                  current_user: User = Depends(require_admin)):
    if body.system_role not in ("user", "moderator", "admin"):
        raise HTTPException(status_code=400, detail="Invalid role")
    u = db.query(User).filter(User.id == uid).first()
    if not u: raise HTTPException(status_code=404, detail="User not found")
    old = user_to_dict(u)
    u.system_role = body.system_role
    u.updated_at = datetime.utcnow()
    db.commit(); db.refresh(u)
    log_action(db, actor=current_user, action="user.set_role",
               entity_type="user", entity_id=u.id,
               old_value=old, new_value=user_to_dict(u))
    return {"detail": f"Role set to {body.system_role}", "system_role": u.system_role}

# ──────── LISTINGS (all statuses) ────────
@router.get("/listings")
def bo_list_listings(status_filter: Optional[str] = None, city: Optional[str] = None,
                     skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
                     db: Session = Depends(get_db), current_user: User = Depends(require_moderator)):
    q = db.query(Listing)
    if status_filter: q = q.filter(Listing.status == status_filter)
    if city: q = q.filter(Listing.city.ilike(f"%{city}%"))
    total = q.count()
    listings = q.order_by(desc(Listing.created_at)).offset(skip).limit(limit).all()
    return {"total": total, "items": [{
        "id": l.id, "title": l.title, "city": l.city, "district": l.district,
        "price_kzt": l.price_kzt, "rooms": l.rooms, "status": l.status,
        "owner_id": l.owner_id, "owner_name": l.owner.full_name if l.owner else None,
        "created_at": l.created_at.isoformat() if l.created_at else None,
    } for l in listings]}

# ──────── COMPLAINTS ────────
@router.get("/complaints")
def list_complaints(status_filter: Optional[str] = None,
                    db: Session = Depends(get_db),
                    current_user: User = Depends(require_moderator)):
    q = db.query(Complaint)
    if status_filter: q = q.filter(Complaint.status == status_filter)
    items = q.order_by(desc(Complaint.created_at)).all()
    return [{"id": c.id, "reporter_id": c.reporter_id, "entity_type": c.entity_type,
             "entity_id": c.entity_id, "reason": c.reason, "status": c.status,
             "resolution": c.resolution, "created_at": c.created_at.isoformat() if c.created_at else None,
             } for c in items]

class ResolveComplaint(BaseModel):
    status: str  # resolved, dismissed
    resolution: Optional[str] = None

@router.put("/complaints/{cid}")
def resolve_complaint(cid: int, body: ResolveComplaint, db: Session = Depends(get_db),
                      current_user: User = Depends(require_moderator)):
    c = db.query(Complaint).filter(Complaint.id == cid).first()
    if not c: raise HTTPException(status_code=404, detail="Not found")
    c.status = body.status; c.resolution = body.resolution
    c.resolved_by = current_user.id; c.resolved_at = datetime.utcnow()
    db.commit()
    log_action(db, actor=current_user, action=f"complaint.{body.status}",
               entity_type="complaint", entity_id=c.id,
               new_value={"status": c.status, "resolution": c.resolution})
    return {"detail": f"Complaint {body.status}"}

# ──────── SEND NOTIFICATION ────────
class SendNotif(BaseModel):
    user_id: int
    title: str
    content: str

@router.post("/notifications/send")
def admin_send_notification(body: SendNotif, db: Session = Depends(get_db),
                            current_user: User = Depends(require_admin)):
    send_notification(db, user_id=body.user_id, title=body.title,
                      content=body.content, type="system")
    log_action(db, actor=current_user, action="notification.send",
               entity_type="notification", entity_id=body.user_id,
               metadata={"title": body.title})
    return {"detail": "Notification sent"}
