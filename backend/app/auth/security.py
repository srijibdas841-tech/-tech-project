import hashlib
import os
from datetime import datetime, timedelta
from typing import Optional, Union, Any
from jose import jwt
from app.config import settings

def get_password_hash(password: str) -> str:
    """Hashes a password with salt using SHA-256 for maximum compatibility and security."""
    salt = os.urandom(16).hex()
    hash_obj = hashlib.sha256((salt + password).encode("utf-8"))
    return f"{salt}${hash_obj.hexdigest()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored salt$hash."""
    try:
        if "$" in hashed_password:
            salt, stored_hash = hashed_password.split("$", 1)
            hash_obj = hashlib.sha256((salt + plain_password).encode("utf-8"))
            return hash_obj.hexdigest() == stored_hash
        # Fallback for plain comparison or legacy
        return plain_password == hashed_password
    except Exception:
        return False

def create_access_token(subject: Union[str, Any], role: str, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "role": role
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return None
