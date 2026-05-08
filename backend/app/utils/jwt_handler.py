from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, Header, Query
from app.config import settings

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        return payload
    except JWTError:
        return None

def get_token_from_header(authorization: Optional[str] = Header(None), token: Optional[str] = Query(None)):
    """Extract token from Authorization header or query parameter"""
    if authorization:
        # Extract token from "Bearer <token>"
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            return parts[1]
    if token:
        return token
    return None

async def get_current_user(
    authorization: Optional[str] = Header(None),
    token: Optional[str] = Query(None)
):
    """Dependency to get current user from token"""
    token_str = get_token_from_header(authorization, token)
    if not token_str:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_token(token_str)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    return payload
