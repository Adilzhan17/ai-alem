"""
RFQ (Request For Quotation) endpoints.
Minimal workflow: create RFQ from estimate, list RFQs, list quotes, award quote.
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, require_client_or_admin, require_role
from app.models.estate import RFQRequest, RFQQuote, Contractor, User
from app.services.audit_service import log_action
from app.services.notification_service import send_notification

router = APIRouter()


class RFQItem(BaseModel):
    item: str
    quantity: float
    unit: str
    price: float
    total: float


class RFQCreate(BaseModel):
    project_id: Optional[int] = None
    estimate_items: Optional[List[RFQItem]] = None
    total_cost: Optional[float] = None
    budget_range: Optional[str] = None
    scope: Optional[str] = None


def _rfq_out(r: RFQRequest) -> dict:
    return {
        "id": r.id,
        "project_id": r.project_id,
        "requester_id": r.requester_id,
        "contractor_id": r.contractor_id,
        "scope": r.scope,
        "budget_range": r.budget_range,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _quote_out(q: RFQQuote) -> dict:
    return {
        "id": q.id,
        "rfq_id": q.rfq_id,
        "contractor_id": q.contractor_id,
        "contractor_name": q.contractor.company_name if q.contractor else None,
        "amount": q.amount,
        "timeline_days": q.timeline_days,
        "notes": q.notes,
        "status": q.status,
        "created_at": q.created_at.isoformat() if q.created_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_rfq(
    data: RFQCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    scope = data.scope
    if not scope and data.estimate_items:
        scope = f"BOQ items: {len(data.estimate_items)}"
    if not scope:
        scope = "Estimate-based RFQ"

    rfq = RFQRequest(
        project_id=data.project_id,
        requester_id=current_user.id,
        contractor_id=None,
        scope=scope,
        budget_range=data.budget_range,
        status="open",
        created_at=datetime.utcnow(),
    )
    db.add(rfq)
    db.commit()
    db.refresh(rfq)

    # Create 1-3 mock quotes based on top contractors, if any exist
    contractors = db.query(Contractor).order_by(desc(Contractor.rating)).limit(3).all()
    multipliers = [0.98, 1.03, 1.07]
    quotes = []
    if contractors:
        base_amount = data.total_cost or 0
        for idx, c in enumerate(contractors):
            amount = base_amount * multipliers[idx] if base_amount else 0
            q = RFQQuote(
                rfq_id=rfq.id,
                contractor_id=c.id,
                amount=amount,
                timeline_days=30 + idx * 10,
                notes="Auto-generated quote (MVP)",
                status="submitted",
                created_at=datetime.utcnow(),
            )
            db.add(q)
            quotes.append(q)
        db.commit()
        for q in quotes:
            db.refresh(q)

    log_action(
        db, actor=current_user, action="rfq.create",
        entity_type="rfq", entity_id=rfq.id,
        new_value={"scope": rfq.scope, "budget_range": rfq.budget_range},
    )

    return {
        "rfq": _rfq_out(rfq),
        "quotes": [_quote_out(q) for q in quotes],
    }


@router.get("")
def list_rfqs(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
    include_quotes: bool = False,
    status_filter: Optional[str] = None,
    sort: str = "date_desc",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    q = db.query(RFQRequest).filter(RFQRequest.requester_id == current_user.id)
    if status_filter:
        if status_filter == "archived":
            q = q.filter(RFQRequest.status.in_(["accepted", "rejected"]))
        else:
            q = q.filter(RFQRequest.status == status_filter)
    if sort == "date_asc":
        q = q.order_by(RFQRequest.created_at.asc())
    else:
        q = q.order_by(desc(RFQRequest.created_at))
    rfqs = q.offset(skip).limit(limit).all()
    if not include_quotes:
        return [_rfq_out(r) for r in rfqs]

    results = []
    for r in rfqs:
        quotes = db.query(RFQQuote).filter(RFQQuote.rfq_id == r.id).order_by(desc(RFQQuote.created_at)).all()
        results.append({
            **_rfq_out(r),
            "quotes": [_quote_out(q) for q in quotes],
        })
    return results


@router.get("/{rfq_id}")
def get_rfq(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    rfq = db.query(RFQRequest).filter(RFQRequest.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq.requester_id != current_user.id and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not your RFQ")
    return _rfq_out(rfq)


@router.get("/{rfq_id}/quotes")
def list_rfq_quotes(
    rfq_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    rfq = db.query(RFQRequest).filter(RFQRequest.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq.requester_id != current_user.id and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not your RFQ")

    quotes = db.query(RFQQuote).filter(RFQQuote.rfq_id == rfq_id).order_by(desc(RFQQuote.created_at)).all()
    return [_quote_out(q) for q in quotes]


@router.post("/quotes/{quote_id}/award")
def award_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    quote = db.query(RFQQuote).filter(RFQQuote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    rfq = db.query(RFQRequest).filter(RFQRequest.id == quote.rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")
    if rfq.requester_id != current_user.id and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not your RFQ")

    # Set awarded status
    quotes = db.query(RFQQuote).filter(RFQQuote.rfq_id == rfq.id).all()
    for q in quotes:
        q.status = "accepted" if q.id == quote_id else "rejected"
    rfq.status = "accepted"
    rfq.contractor_id = quote.contractor_id
    db.commit()

    log_action(
        db, actor=current_user, action="rfq.award",
        entity_type="rfq", entity_id=rfq.id,
        new_value={"quote_id": quote_id, "contractor_id": quote.contractor_id},
    )

    # Notify contractor and requester
    contractor_user_id = quote.contractor.user_id if quote.contractor else None
    if contractor_user_id:
        send_notification(
            db,
            user_id=contractor_user_id,
            title="Ваше КП принято",
            content=f"Клиент выбрал ваше предложение по RFQ #{rfq.id}.",
            type="rfq",
            link=f"/contractor",
            entity_type="rfq",
            entity_id=rfq.id,
        )

    send_notification(
        db,
        user_id=rfq.requester_id,
        title="Вы выбрали подрядчика",
        content=f"КП по RFQ #{rfq.id} принято.",
        type="rfq",
        link=f"/requests",
        entity_type="rfq",
        entity_id=rfq.id,
    )

    return {"detail": "Quote awarded", "rfq_id": rfq.id, "quote_id": quote_id}


# ──────────────── CONTRACTOR INBOX ────────────────
@router.get("/inbox")
def contractor_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("contractor")),
    status_filter: str = "open",
    sort: str = "date_desc",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor profile not found")

    q = db.query(RFQRequest)
    if status_filter == "open":
        q = q.filter(RFQRequest.status == "open")
    elif status_filter == "archived":
        q = q.filter(RFQRequest.status.in_(["accepted", "rejected"]))
    else:
        q = q.filter(RFQRequest.status == status_filter)

    if sort == "date_asc":
        q = q.order_by(RFQRequest.created_at.asc())
    else:
        q = q.order_by(desc(RFQRequest.created_at))

    rfqs = q.offset(skip).limit(limit).all()
    results = []
    for r in rfqs:
        my_quote = db.query(RFQQuote).filter(
            RFQQuote.rfq_id == r.id,
            RFQQuote.contractor_id == contractor.id,
        ).first()
        if status_filter != "open" and not my_quote and r.contractor_id != contractor.id:
            continue
        results.append({
            **_rfq_out(r),
            "my_quote": _quote_out(my_quote) if my_quote else None,
        })
    return results


class ContractorQuoteCreate(BaseModel):
    amount: float
    timeline_days: Optional[int] = None
    notes: Optional[str] = None


@router.post("/{rfq_id}/quote", status_code=status.HTTP_201_CREATED)
def submit_contractor_quote(
    rfq_id: int,
    data: ContractorQuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("contractor")),
):
    contractor = db.query(Contractor).filter(Contractor.user_id == current_user.id).first()
    if not contractor:
        raise HTTPException(status_code=404, detail="Contractor profile not found")

    rfq = db.query(RFQRequest).filter(RFQRequest.id == rfq_id).first()
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found")

    existing = db.query(RFQQuote).filter(
        RFQQuote.rfq_id == rfq_id,
        RFQQuote.contractor_id == contractor.id,
    ).first()
    if existing:
        existing.amount = data.amount
        existing.timeline_days = data.timeline_days
        existing.notes = data.notes
        existing.status = "submitted"
        db.commit()
        db.refresh(existing)
        # Notify requester
        send_notification(
            db,
            user_id=rfq.requester_id,
            title="Новый КП от подрядчика",
            content=f"Подрядчик обновил предложение по RFQ #{rfq.id}.",
            type="rfq",
            link=f"/requests",
            entity_type="rfq",
            entity_id=rfq.id,
        )
        return _quote_out(existing)

    quote = RFQQuote(
        rfq_id=rfq_id,
        contractor_id=contractor.id,
        amount=data.amount,
        timeline_days=data.timeline_days,
        notes=data.notes,
        status="submitted",
        created_at=datetime.utcnow(),
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)

    log_action(
        db, actor=current_user, action="rfq.quote.submit",
        entity_type="rfq", entity_id=rfq_id,
        new_value={"amount": quote.amount},
    )

    send_notification(
        db,
        user_id=rfq.requester_id,
        title="Новый КП от подрядчика",
        content=f"Подрядчик отправил предложение по RFQ #{rfq.id}.",
        type="rfq",
        link=f"/requests",
        entity_type="rfq",
        entity_id=rfq.id,
    )

    return _quote_out(quote)
