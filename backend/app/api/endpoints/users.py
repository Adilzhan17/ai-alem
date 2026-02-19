from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.models.estate import User, Notification
from app.api.deps import get_db, get_current_user
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    interface_lang: Optional[str] = None
    currency_format: Optional[str] = None
    avatar_url: Optional[str] = None
    phone: Optional[str] = None

@router.get("/me")
def read_user_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "system_role": current_user.system_role or "user",
        "company_name": current_user.company_name,
        "phone": current_user.phone,
        "interface_lang": current_user.interface_lang,
        "currency_format": current_user.currency_format,
        "avatar_url": current_user.avatar_url,
        "is_banned": current_user.is_banned or False,
        "is_verified": current_user.is_verified or False,
    }

@router.put("/me")
def update_user_me(obj_in: UserUpdate, db: Session = Depends(get_db),
                   current_user: User = Depends(get_current_user)):
    if obj_in.full_name is not None:
        current_user.full_name = obj_in.full_name
    if obj_in.interface_lang is not None:
        current_user.interface_lang = obj_in.interface_lang
    if obj_in.currency_format is not None:
        current_user.currency_format = obj_in.currency_format
    if obj_in.avatar_url is not None:
        current_user.avatar_url = obj_in.avatar_url
    if obj_in.phone is not None:
        current_user.phone = obj_in.phone

    db.add(current_user)
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "system_role": current_user.system_role or "user",
        "company_name": current_user.company_name,
        "phone": current_user.phone,
        "interface_lang": current_user.interface_lang,
        "currency_format": current_user.currency_format,
        "avatar_url": current_user.avatar_url,
    }

@router.get("/notifications")
def get_notifications(db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    notifs = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()

    return [{
        "id": n.id,
        "title": n.title,
        "content": n.content,
        "type": n.type,
        "is_read": n.is_read,
        "link": n.link,
        "entity_type": n.entity_type,
        "entity_id": n.entity_id,
        "created_at": n.created_at.isoformat() if n.created_at else None,
    } for n in notifs]

@router.put("/notifications/{notif_id}/read")
def read_notification(notif_id: int, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    notif = db.query(Notification).filter(
        Notification.id == notif_id,
        Notification.user_id == current_user.id,
    ).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.add(notif)
    db.commit()
    return {"status": "ok"}
