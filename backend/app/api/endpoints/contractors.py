"""
Contractors & Suppliers CRUD.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.api.deps import get_db, get_current_user, require_role
from app.models.estate import Contractor, Supplier, User
from app.services.audit_service import log_action

router = APIRouter()

class ContractorUpdate(BaseModel):
    company_name: Optional[str] = None
    specializations: Optional[list] = None
    description: Optional[str] = None
    portfolio_json: Optional[list] = None
    city: Optional[str] = None

class SupplierUpdate(BaseModel):
    company_name: Optional[str] = None
    catalog_json: Optional[list] = None
    city: Optional[str] = None

def _co(c: Contractor) -> dict:
    return {
        "id": c.id, "user_id": c.user_id, "company_name": c.company_name,
        "specializations": c.specializations or [], "rating": c.rating,
        "rating_count": c.rating_count, "is_verified": c.is_verified,
        "description": c.description, "portfolio_json": c.portfolio_json,
        "city": c.city,
        "user_name": c.user.full_name if c.user else None,
        "user_email": c.user.email if c.user else None,
        "user_avatar": c.user.avatar_url if c.user else None,
        "created_at": c.created_at.isoformat() if c.created_at else None,
    }

def _so(s: Supplier) -> dict:
    return {
        "id": s.id, "user_id": s.user_id, "company_name": s.company_name,
        "catalog_json": s.catalog_json or [], "rating": s.rating,
        "rating_count": s.rating_count, "is_verified": s.is_verified, "city": s.city,
        "user_name": s.user.full_name if s.user else None,
        "created_at": s.created_at.isoformat() if s.created_at else None,
    }

@router.get("/contractors")
def list_contractors(city: Optional[str] = None, verified_only: bool = False,
                     skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=100),
                     db: Session = Depends(get_db)):
    q = db.query(Contractor)
    if city: q = q.filter(Contractor.city.ilike(f"%{city}%"))
    if verified_only: q = q.filter(Contractor.is_verified == True)
    total = q.count()
    items = [_co(c) for c in q.order_by(desc(Contractor.rating)).offset(skip).limit(limit).all()]
    return {"total": total, "items": items}

@router.get("/contractors/me")
def get_my_contractor(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("contractor")),
):
    c = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
    if not c:
        raise HTTPException(status_code=404, detail="Contractor profile not found")
    return _co(c)

@router.get("/contractors/{cid}")
def get_contractor(cid: int, db: Session = Depends(get_db)):
    c = db.query(Contractor).filter(Contractor.id == cid).first()
    if not c: raise HTTPException(status_code=404, detail="Not found")
    return _co(c)

@router.put("/contractors/{cid}")
def update_contractor(cid: int, data: ContractorUpdate, db: Session = Depends(get_db),
                      current_user: User = Depends(get_current_user)):
    c = db.query(Contractor).filter(Contractor.id == cid).first()
    if not c: raise HTTPException(status_code=404, detail="Not found")
    if c.user_id != current_user.id and (current_user.system_role or "user") != "admin":
        raise HTTPException(status_code=403, detail="Not your profile")
    for k, v in data.model_dump(exclude_unset=True).items(): setattr(c, k, v)
    c.updated_at = datetime.utcnow()
    db.commit(); db.refresh(c)
    log_action(db, actor=current_user, action="contractor.update",
               entity_type="contractor", entity_id=c.id, new_value={"company_name": c.company_name})
    return _co(c)

@router.get("/suppliers")
def list_suppliers(city: Optional[str] = None, db: Session = Depends(get_db)):
    q = db.query(Supplier)
    if city: q = q.filter(Supplier.city.ilike(f"%{city}%"))
    items = [_so(s) for s in q.order_by(desc(Supplier.rating)).all()]
    return {"total": len(items), "items": items}

@router.get("/suppliers/me")
def get_my_supplier(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier-materials")),
):
    s = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier profile not found")
    return _so(s)

@router.get("/suppliers/{sid}")
def get_supplier(sid: int, db: Session = Depends(get_db)):
    s = db.query(Supplier).filter(Supplier.id == sid).first()
    if not s: raise HTTPException(status_code=404, detail="Not found")
    return _so(s)

@router.put("/suppliers/{sid}")
def update_supplier(sid: int, data: SupplierUpdate, db: Session = Depends(get_db),
                    current_user: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == sid).first()
    if not s: raise HTTPException(status_code=404, detail="Not found")
    if s.user_id != current_user.id and (current_user.system_role or "user") != "admin":
        raise HTTPException(status_code=403, detail="Not your profile")
    for k, v in data.model_dump(exclude_unset=True).items(): setattr(s, k, v)
    s.updated_at = datetime.utcnow()
    db.commit(); db.refresh(s)
    log_action(db, actor=current_user, action="supplier.update",
               entity_type="supplier", entity_id=s.id, new_value={"company_name": s.company_name})
    return _so(s)
