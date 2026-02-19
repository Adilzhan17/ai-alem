"""
Listings CRUD — create, read, update, submit for moderation.
Every action → audit_log.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, require_client_or_admin
from app.models.estate import Listing, User
from app.services.audit_service import log_action, listing_to_dict
from app.services.notification_service import send_notification

router = APIRouter()


# ──────────────── Schemas ────────────────
class ListingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    city: str
    district: Optional[str] = None
    residential_complex: Optional[str] = None
    address: Optional[str] = None
    price_kzt: float
    rooms: Optional[int] = None
    area_sqm: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    images_json: Optional[list] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    residential_complex: Optional[str] = None
    address: Optional[str] = None
    price_kzt: Optional[float] = None
    rooms: Optional[int] = None
    area_sqm: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    images_json: Optional[list] = None

class ListingOut(BaseModel):
    id: int
    owner_id: int
    title: str
    description: Optional[str]
    city: str
    district: Optional[str]
    residential_complex: Optional[str]
    address: Optional[str]
    price_kzt: float
    rooms: Optional[int]

router = APIRouter()


# ──────────────── Schemas ────────────────
class ListingCreate(BaseModel):
    title: str
    description: Optional[str] = None
    city: str
    district: Optional[str] = None
    residential_complex: Optional[str] = None
    address: Optional[str] = None
    price_kzt: float
    rooms: Optional[int] = None
    area_sqm: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    images_json: Optional[list] = None
    metadata_json: Optional[dict] = None

class ListingUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    city: Optional[str] = None
    district: Optional[str] = None
    residential_complex: Optional[str] = None
    address: Optional[str] = None
    price_kzt: Optional[float] = None
    rooms: Optional[int] = None
    area_sqm: Optional[float] = None
    floor: Optional[int] = None
    total_floors: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = None
    images_json: Optional[list] = None
    metadata_json: Optional[dict] = None

class ListingOut(BaseModel):
    id: int
    owner_id: int
    title: str
    description: Optional[str]
    city: str
    district: Optional[str]
    residential_complex: Optional[str]
    address: Optional[str]
    price_kzt: float
    rooms: Optional[int]
    area_sqm: Optional[float]
    floor: Optional[int]
    total_floors: Optional[int]
    latitude: Optional[float]
    longitude: Optional[float]
    image_url: Optional[str]
    images_json: Optional[list]
    metadata_json: Optional[dict]
    status: str
    moderation_comment: Optional[str]
    created_at: Optional[str]
    updated_at: Optional[str]
    owner_name: Optional[str] = None

    class Config:
        from_attributes = True


def _listing_to_out(l: Listing) -> dict:
    return {
        "id": l.id,
        "owner_id": l.owner_id,
        "title": l.title,
        "description": l.description,
        "city": l.city,
        "district": l.district,
        "residential_complex": l.residential_complex,
        "address": l.address,
        "price_kzt": l.price_kzt,
        "rooms": l.rooms,
        "area_sqm": l.area_sqm,
        "floor": l.floor,
        "total_floors": l.total_floors,
        "latitude": l.latitude,
        "longitude": l.longitude,
        "image_url": l.image_url,
        "images_json": l.images_json,
        "metadata_json": l.metadata_json,
        "status": l.status,
        "moderation_comment": l.moderation_comment,
        "created_at": l.created_at.isoformat() if l.created_at else None,
        "updated_at": l.updated_at.isoformat() if l.updated_at else None,
        "owner_name": l.owner.full_name if l.owner else None,
    }


# ──────────────── CREATE ────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
def create_listing(
    data: ListingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    listing = Listing(
        owner_id=current_user.id,
        title=data.title,
        description=data.description,
        city=data.city,
        district=data.district,
        residential_complex=data.residential_complex,
        address=data.address,
        price_kzt=data.price_kzt,
        rooms=data.rooms,
        area_sqm=data.area_sqm,
        floor=data.floor,
        total_floors=data.total_floors,
        latitude=data.latitude,
        longitude=data.longitude,
        image_url=data.image_url,
        images_json=data.images_json,
        metadata_json=data.metadata_json,
        status="draft",
    )
    db.add(listing)
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="listing.create",
        entity_type="listing",
        entity_id=listing.id,
        new_value=listing_to_dict(listing),
    )

    return _listing_to_out(listing)


# ──────────────── LIST (public — only approved) ────────────────
@router.get("")
def list_listings(
    city: Optional[str] = None,
    district: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    rooms: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db),
):
    q = db.query(Listing).filter(Listing.status == "approved")

    if city:
        q = q.filter(Listing.city.ilike(f"%{city}%"))
    if district:
        q = q.filter(Listing.district.ilike(f"%{district}%"))
    if min_price is not None:
        q = q.filter(Listing.price_kzt >= min_price)
    if max_price is not None:
        q = q.filter(Listing.price_kzt <= max_price)
    if rooms is not None:
        q = q.filter(Listing.rooms == rooms)

    total = q.count()
    listings = q.order_by(desc(Listing.created_at)).offset(skip).limit(limit).all()

    return {
        "total": total,
        "items": [_listing_to_out(l) for l in listings],
    }


# ──────────────── MY LISTINGS ────────────────
@router.get("/mine")
def my_listings(
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    q = db.query(Listing).filter(Listing.owner_id == current_user.id)
    if status_filter:
        q = q.filter(Listing.status == status_filter)

    listings = q.order_by(desc(Listing.created_at)).all()
    return [_listing_to_out(l) for l in listings]


# ──────────────── GET by ID ────────────────
@router.get("/{listing_id}")
def get_listing(
    listing_id: int,
    db: Session = Depends(get_db),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    return _listing_to_out(listing)


# ──────────────── UPDATE ────────────────
@router.put("/{listing_id}")
def update_listing(
    listing_id: int,
    data: ListingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not your listing")

    if listing.status not in ("draft", "needs_changes") and (current_user.system_role or "user") not in ("admin",):
        raise HTTPException(status_code=400, detail=f"Cannot edit listing in '{listing.status}' status")

    old = listing_to_dict(listing)

    update_fields = data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(listing, field, value)

    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="listing.update",
        entity_type="listing",
        entity_id=listing.id,
        old_value=old,
        new_value=listing_to_dict(listing),
    )

    return _listing_to_out(listing)


# ──────────────── SUBMIT FOR MODERATION ────────────────
@router.post("/{listing_id}/submit")
def submit_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    if listing.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your listing")

    if listing.status not in ("draft", "needs_changes", "rejected"):
        raise HTTPException(status_code=400, detail=f"Cannot submit from '{listing.status}' status")

    old = listing_to_dict(listing)
    listing.status = "pending_review"
    listing.moderation_comment = None
    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="listing.submit",
        entity_type="listing",
        entity_id=listing.id,
        old_value=old,
        new_value=listing_to_dict(listing),
    )

    return _listing_to_out(listing)


# ──────────────── DELETE (soft) ────────────────
@router.delete("/{listing_id}")
def delete_listing(
    listing_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    listing = db.query(Listing).filter(Listing.id == listing_id).first()
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    is_admin = (current_user.system_role or "user") == "admin"
    if listing.owner_id != current_user.id and not is_admin:
        raise HTTPException(status_code=403, detail="Not your listing")

    old = listing_to_dict(listing)

    if is_admin:
        listing.status = "removed"
    else:
        listing.status = "archived"

    listing.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(listing)

    log_action(
        db,
        actor=current_user,
        action="listing.delete",
        entity_type="listing",
        entity_id=listing.id,
        old_value=old,
        new_value=listing_to_dict(listing),
    )

    return {"detail": "Listing archived" if not is_admin else "Listing removed"}
