from datetime import datetime, timedelta
from typing import Any, Union
from jose import jwt
from passlib.context import CryptContext

# Switch to sha256_crypt for compatibility
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")

ALGORITHM = "HS256"
SECRET_KEY = "SUPER_SECRET_CHANGE_ME_IN_PROD"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week session

def create_access_token(subject: Union[str, Any]) -> str:
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Decode JWT and return payload with user_id, or None if invalid."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        return {"user_id": int(user_id)}
    except Exception:
        return None

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)
