"""
Supply Requests endpoints for suppliers.
Clients create requests, suppliers respond with quotes.
"""
from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.api.deps import get_db, get_current_user, require_client_or_admin, require_role
from app.models.estate import SupplyRequest, SupplyQuote, Supplier, User
from app.services.audit_service import log_action
from app.services.notification_service import send_notification

router = APIRouter()


class SupplyItem(BaseModel):
    item: str
    quantity: float
    unit: str
    price: float
    total: float


class SupplyRequestCreate(BaseModel):
    items_json: Optional[List[SupplyItem]] = None
    budget_range: Optional[str] = None


def _request_out(r: SupplyRequest) -> dict:
    return {
        "id": r.id,
        "requester_id": r.requester_id,
        "supplier_id": r.supplier_id,
        "items_json": r.items_json,
        "budget_range": r.budget_range,
        "status": r.status,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


def _quote_out(q: SupplyQuote) -> dict:
    return {
        "id": q.id,
        "request_id": q.request_id,
        "supplier_id": q.supplier_id,
        "supplier_name": q.supplier.company_name if q.supplier else None,
        "amount": q.amount,
        "notes": q.notes,
        "status": q.status,
        "created_at": q.created_at.isoformat() if q.created_at else None,
    }


@router.post("", status_code=status.HTTP_201_CREATED)
def create_supply_request(
    data: SupplyRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    req = SupplyRequest(
        requester_id=current_user.id,
        items_json=[i.model_dump() for i in (data.items_json or [])],
        budget_range=data.budget_range,
        status="open",
        created_at=datetime.utcnow(),
    )
    db.add(req)
    db.commit()
    db.refresh(req)

    log_action(
        db, actor=current_user, action="supply_request.create",
        entity_type="supply_request", entity_id=req.id,
        new_value={"budget_range": req.budget_range},
    )

    return _request_out(req)


@router.get("")
def list_my_supply_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
    include_quotes: bool = False,
    status_filter: Optional[str] = None,
    sort: str = "date_desc",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    q = db.query(SupplyRequest).filter(
        SupplyRequest.requester_id == current_user.id
    )
    if status_filter:
        if status_filter == "archived":
            q = q.filter(SupplyRequest.status.in_(["accepted", "rejected"]))
        else:
            q = q.filter(SupplyRequest.status == status_filter)
    if sort == "date_asc":
        q = q.order_by(SupplyRequest.created_at.asc())
    else:
        q = q.order_by(desc(SupplyRequest.created_at))
    reqs = q.offset(skip).limit(limit).all()
    if not include_quotes:
        return [_request_out(r) for r in reqs]

    results = []
    for r in reqs:
        quotes = db.query(SupplyQuote).filter(SupplyQuote.request_id == r.id).order_by(desc(SupplyQuote.created_at)).all()
        results.append({
            **_request_out(r),
            "quotes": [_quote_out(q) for q in quotes],
        })
    return results


@router.get("/inbox")
def list_supplier_inbox(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier-materials")),
    status_filter: str = "open",
    sort: str = "date_desc",
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier profile not found")

    q = db.query(SupplyRequest)
    if status_filter == "open":
        q = q.filter(SupplyRequest.status == "open")
    elif status_filter == "archived":
        q = q.filter(SupplyRequest.status.in_(["accepted", "rejected"]))
    else:
        q = q.filter(SupplyRequest.status == status_filter)

    if sort == "date_asc":
        q = q.order_by(SupplyRequest.created_at.asc())
    else:
        q = q.order_by(desc(SupplyRequest.created_at))

    reqs = q.offset(skip).limit(limit).all()

    # Attach existing quote if any
    results = []
    for r in reqs:
        existing = db.query(SupplyQuote).filter(
            SupplyQuote.request_id == r.id,
            SupplyQuote.supplier_id == supplier.id,
        ).first()
        if status_filter != "open" and not existing and r.supplier_id != supplier.id:
            continue
        results.append({
            **_request_out(r),
            "my_quote": _quote_out(existing) if existing else None,
        })
    return results


class SupplyQuoteCreate(BaseModel):
    amount: float
    notes: Optional[str] = None


@router.post("/{request_id}/quote", status_code=status.HTTP_201_CREATED)
def create_supply_quote(
    request_id: int,
    data: SupplyQuoteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("supplier-materials")),
):
    supplier = db.query(Supplier).filter(Supplier.user_id == current_user.id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier profile not found")

    req = db.query(SupplyRequest).filter(SupplyRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Supply request not found")

    existing = db.query(SupplyQuote).filter(
        SupplyQuote.request_id == request_id,
        SupplyQuote.supplier_id == supplier.id,
    ).first()
    if existing:
        existing.amount = data.amount
        existing.notes = data.notes
        existing.status = "submitted"
        db.commit()
        db.refresh(existing)
        send_notification(
            db,
            user_id=req.requester_id,
            title="Новое КП от поставщика",
            content=f"Поставщик обновил предложение по запросу #{req.id}.",
            type="supply",
            link="/requests",
            entity_type="supply_request",
            entity_id=req.id,
        )
        return _quote_out(existing)

    quote = SupplyQuote(
        request_id=request_id,
        supplier_id=supplier.id,
        amount=data.amount,
        notes=data.notes,
        status="submitted",
        created_at=datetime.utcnow(),
    )
    db.add(quote)
    db.commit()
    db.refresh(quote)

    log_action(
        db, actor=current_user, action="supply_quote.submit",
        entity_type="supply_request", entity_id=req.id,
        new_value={"amount": quote.amount},
    )

    send_notification(
        db,
        user_id=req.requester_id,
        title="Новое КП от поставщика",
        content=f"Поставщик отправил предложение по запросу #{req.id}.",
        type="supply",
        link="/requests",
        entity_type="supply_request",
        entity_id=req.id,
    )

    return _quote_out(quote)


@router.post("/quotes/{quote_id}/award")
def award_supply_quote(
    quote_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_client_or_admin),
):
    quote = db.query(SupplyQuote).filter(SupplyQuote.id == quote_id).first()
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")

    req = db.query(SupplyRequest).filter(SupplyRequest.id == quote.request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Supply request not found")
    if req.requester_id != current_user.id and (current_user.system_role or "user") not in ("admin", "moderator"):
        raise HTTPException(status_code=403, detail="Not your request")

    quotes = db.query(SupplyQuote).filter(SupplyQuote.request_id == req.id).all()
    for q in quotes:
        q.status = "accepted" if q.id == quote_id else "rejected"
    req.status = "accepted"
    req.supplier_id = quote.supplier_id
    db.commit()

    log_action(
        db, actor=current_user, action="supply_request.award",
        entity_type="supply_request", entity_id=req.id,
        new_value={"quote_id": quote_id, "supplier_id": quote.supplier_id},
    )

    supplier_user_id = quote.supplier.user_id if quote.supplier else None
    if supplier_user_id:
        send_notification(
            db,
            user_id=supplier_user_id,
            title="Ваше КП принято",
            content=f"Клиент выбрал ваше предложение по запросу #{req.id}.",
            type="supply",
            link="/supplier",
            entity_type="supply_request",
            entity_id=req.id,
        )

    send_notification(
        db,
        user_id=req.requester_id,
        title="Вы выбрали поставщика",
        content=f"КП по запросу #{req.id} принято.",
        type="supply",
        link="/requests",
        entity_type="supply_request",
        entity_id=req.id,
    )

    return {"detail": "Quote awarded", "request_id": req.id, "quote_id": quote_id}
