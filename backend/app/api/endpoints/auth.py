from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.db.base import SessionLocal
from app.models.estate import User, Contractor, Supplier
from app.core import security
from app.services.audit_service import log_action
from pydantic import BaseModel, EmailStr
from typing import Optional

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login")

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str  # client, contractor, supplier-materials
    company_name: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

def _user_dict(u: User) -> dict:
    return {
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "role": u.role,
        "system_role": u.system_role or "user",
        "company_name": u.company_name,
        "is_banned": u.is_banned or False,
        "is_verified": u.is_verified or False,
    }

@router.post("/register", response_model=Token)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email).first()
    if user:
        raise HTTPException(status_code=400, detail="Этот email уже зарегистрирован")

    new_user = User(
        email=user_in.email,
        hashed_password=security.get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        system_role="user",
        company_name=user_in.company_name,
        is_banned=False,
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Auto-create contractor/supplier profile
    if user_in.role == "contractor":
        contractor = Contractor(
            user_id=new_user.id,
            company_name=user_in.company_name or new_user.full_name,
        )
        db.add(contractor)
        db.commit()
    elif user_in.role == "supplier-materials":
        supplier = Supplier(
            user_id=new_user.id,
            company_name=user_in.company_name or new_user.full_name,
        )
        db.add(supplier)
        db.commit()

    log_action(
        db, actor=new_user, action="user.register",
        entity_type="user", entity_id=new_user.id,
        new_value=_user_dict(new_user),
    )

    access_token = security.create_access_token(new_user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_dict(new_user),
    }

@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный email или пароль")

    if user.is_banned:
        raise HTTPException(
            status_code=403,
            detail=f"Аккаунт заблокирован: {user.ban_reason or 'Обратитесь в поддержку'}",
        )

    log_action(
        db, actor=user, action="user.login",
        entity_type="user", entity_id=user.id,
    )

    access_token = security.create_access_token(user.id)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": _user_dict(user),
    }
