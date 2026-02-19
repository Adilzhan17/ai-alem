"""
Moderation endpoints — for moderators and admins only.
All actions → audit_log + notification to listing owner.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, require_moderator
from app.models.estate import Listing, User
from app.services.audit_service import log_action, listing_to_dict
from app.services.notification_service import send_notification

router = APIRouter()


class ModerationAction(BaseModel):
    reason: Optional[str] = None
    comment: Optional[str] = None


# ──────────────── MODERATION QUEUE ────────────────
@router.get("/queue")
def moderation_queue(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    q = db.query(Listing).filter(Listing.status == "pending_review")
    total = q.count()
    listings = q.order_by(desc(Listing.created_at)).offset(skip).limit(limit).all()

    items = []
    for l in listings:
        items.append({
            "id": l.id,
            "title": l.title,
            "city": l.city,
            "district": l.district,
            "price_kzt": l.price_kzt,
            "rooms": l.rooms,
            "area_sqm": l.area_sqm,
            "image_url": l.image_url,
            "status": l.status,
            "owner_id": l.owner_id,
            "owner_name": l.owner.full_name if l.owner else None,
            "owner_email": l.owner.email if l.owner else None,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        })

    return {"total": total, "items": items}


# ──────────────── PREVIEW (as user sees it) ────────────────
@router.get("/listing/{listing_id}")
def preview_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    return {
        "id": listing.id,
        "title": listing.title,
        "description": listing.description,
        "city": listing.city,
        "district": listing.district,
        "residential_complex": listing.residential_complex,
        "address": listing.address,
        "price_kzt": listing.price_kzt,
        "rooms": listing.rooms,
        "area_sqm": listing.area_sqm,
        "floor": listing.floor,
        "total_floors": listing.total_floors,
        "latitude": listing.latitude,
        "longitude": listing.longitude,
        "image_url": listing.image_url,
        "images_json": listing.images_json,
        "status": listing.status,
        "moderation_comment": listing.moderation_comment,
        "owner_id": listing.owner_id,
        "owner_name": listing.owner.full_name if listing.owner else None,
        "owner_email": listing.owner.email if listing.owner else None,
        "created_at": listing.created_at.isoformat() if listing.created_at else None,
        "updated_at": listing.updated_at.isoformat() if listing.updated_at else None,
    }


# ──────────────── APPROVE ────────────────
@router.post("/listing/{listing_id}/approve")
def approve_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "pending_review":
        raise HTTPException(status_code=400, detail=f"Cannot approve listing in '{listing.status}' status")

    old = listing_to_dict(listing)

    listing.status = "approved"
    listing.moderated_by = current_user.id
    listing.moderated_at = datetime.utcnow()
    listing.moderation_comment = None
    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="moderation.approve",
        entity_type="listing",
        entity_id=listing.id,
        old_value=old,
        new_value=listing_to_dict(listing),
    )

    send_notification(
        db,
        user_id=listing.owner_id,
        title="Объявление одобрено ✅",
        content=f"Ваше объявление «{listing.title}» прошло модерацию и опубликовано.",
        type="moderation",
        link=f"/listings/{listing.id}",
        entity_type="listing",
        entity_id=listing.id,
    )

    return {"detail": "Listing approved", "status": listing.status}


# ──────────────── REJECT ────────────────
@router.post("/listing/{listing_id}/reject")
def reject_listing(
    listing_id: int,
    body: ModerationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "pending_review":
        raise HTTPException(status_code=400, detail=f"Cannot reject listing in '{listing.status}' status")
    if not body.reason:
        raise HTTPException(status_code=400, detail="Reason is required for rejection")

    old = listing_to_dict(listing)

    listing.status = "rejected"
    listing.moderated_by = current_user.id
    listing.moderated_at = datetime.utcnow()
    listing.moderation_comment = body.reason
    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="moderation.reject",
        entity_type="listing",
        entity_id=listing.id,
        old_value=old,
        new_value=listing_to_dict(listing),
        metadata={"reason": body.reason},
    )

    send_notification(
        db,
        user_id=listing.owner_id,
        title="Объявление отклонено ❌",
        content=f"Ваше объявление «{listing.title}» отклонено. Причина: {body.reason}",
        type="moderation",
        link=f"/listings/{listing.id}",
        entity_type="listing",
        entity_id=listing.id,
    )

    return {"detail": "Listing rejected", "status": listing.status, "reason": body.reason}


# ──────────────── REQUEST CHANGES ────────────────
@router.post("/listing/{listing_id}/request-changes")
def request_changes(
    listing_id: int,
    body: ModerationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.status != "pending_review":
        raise HTTPException(status_code=400, detail=f"Cannot request changes for listing in '{listing.status}' status")
    if not body.comment:
        raise HTTPException(status_code=400, detail="Comment is required")

    old = listing_to_dict(listing)

    listing.status = "needs_changes"
    listing.moderated_by = current_user.id
    listing.moderated_at = datetime.utcnow()
    listing.moderation_comment = body.comment
    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="moderation.request_changes",
        entity_type="listing",
        entity_id=listing.id,
        old_value=old,
        new_value=listing_to_dict(listing),
        metadata={"comment": body.comment},
    )

    send_notification(
        db,
        user_id=listing.owner_id,
        title="Требуются изменения 📝",
        content=f"Модератор запросил правки к «{listing.title}»: {body.comment}",
        type="moderation",
        link=f"/listings/{listing.id}",
        entity_type="listing",
        entity_id=listing.id,
    )

    return {"detail": "Changes requested", "status": listing.status, "comment": body.comment}


# ──────────────── REMOVE (admin) ────────────────
@router.post("/listing/{listing_id}/remove")
def remove_listing(
    listing_id: int,
    body: ModerationAction,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_moderator),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    old = listing_to_dict(listing)

    listing.status = "removed"
    listing.moderated_by = current_user.id
    listing.moderated_at = datetime.utcnow()
    listing.moderation_comment = body.reason or "Removed by moderator"
    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="moderation.remove",
        entity_type="listing",
        entity_id=listing.id,
        old_value=old,
        new_value=listing_to_dict(listing),
        metadata={"reason": body.reason},
    )

    send_notification(
        db,
        user_id=listing.owner_id,
        title="Объявление удалено 🗑️",
        content=f"Ваше объявление «{listing.title}» было удалено модератором.",
        type="moderation",
        entity_type="listing",
        entity_id=listing.id,
    )

    return {"detail": "Listing removed"}
