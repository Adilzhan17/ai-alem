"""
Estimates / BOQ — create, read, version history.
Persists BOQ data to DB instead of frontend-only state.
"""
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, func

from app.api.deps import get_db, get_current_user, require_client_or_admin
from app.models.estate import Estimate, User
from app.services.audit_service import log_action, estimate_to_dict

router = APIRouter()


class EstimateCreate(BaseModel):
    project_id: Optional[int] = None
    listing_id: Optional[int] = None
    tier: str = "standard"
    items_json: list  # array of BOQ line items
    total_cost: float
    tax_amount: Optional[float] = None
    ai_confidence: Optional[float] = None
    ai_explanation: Optional[str] = None
    source_file_id: Optional[int] = None


def _estimate_out(e: Estimate) -> dict:
    return {
        "id": e.id,
        "project_id": e.project_id,
        "listing_id": e.listing_id,
        "owner_id": e.owner_id,
        "version": e.version,
        "tier": e.tier,
        "items_json": e.items_json,
        "total_cost": e.total_cost,
        "tax_amount": e.tax_amount,
        "ai_confidence": e.ai_confidence,
        "ai_explanation": e.ai_explanation,
        "source_file_id": e.source_file_id,
        "created_at": e.created_at.isoformat() if e.created_at else None,
        "owner_name": e.owner.full_name if e.owner else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_estimate(
    data: EstimateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    # Auto-increment version per project
    max_version = 0
    if data.project_id:
        result = db.query(func.max(Estimate.version)).filter(
            Estimate.project_id == data.project_id
        ).scalar()
        max_version = result or 0

    estimate = Estimate(
        project_id=data.project_id,
        listing_id=data.listing_id,
        owner_id=current_user.id,
        version=max_version + 1,
        tier=data.tier,
        items_json=data.items_json,
        total_cost=data.total_cost,
        tax_amount=data.tax_amount,
        ai_confidence=data.ai_confidence,
        ai_explanation=data.ai_explanation,
        source_file_id=data.source_file_id,
    )
    db.add(estimate)
    db.commit()
    db.refresh(estimate)

    log_action(
        db, actor=current_user, action="estimate.create",
        entity_type="estimate", entity_id=estimate.id,
        new_value=estimate_to_dict(estimate),
    )

    return _estimate_out(estimate)


@router.get("")
def list_estimates(
    project_id: Optional[int] = None,
    listing_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    q = db.query(Estimate).filter(Estimate.owner_id == current_user.id)
    if project_id:
        q = q.filter(Estimate.project_id == project_id)
    if listing_id:
        q = q.filter(Estimate.listing_id == listing_id)

    estimates = q.order_by(desc(Estimate.created_at)).all()
    return [_estimate_out(e) for e in estimates]


@router.get("/{estimate_id}")
def get_estimate(
    estimate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")

    if estimate.owner_id != current_user.id and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not your estimate")

    return _estimate_out(estimate)


@router.get("/{estimate_id}/versions")
def estimate_versions(
    estimate_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    estimate = db.query(Estimate).filter(Estimate.id == estimate_id).first()
    if not estimate:
        raise HTTPException(status_code=404, detail="Estimate not found")
    if not estimate.project_id:
        return [_estimate_out(estimate)]

    versions = db.query(Estimate).filter(
        Estimate.project_id == estimate.project_id
    ).order_by(Estimate.version).all()

    return [_estimate_out(e) for e in versions]
