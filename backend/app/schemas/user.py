from datetime import datetime
from enum import Enum

from pydantic import BaseModel, EmailStr, Field


class UserRole(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GENERIC = "generic"


# ---------- Auth ----------

class UserLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str


# ---------- Sign-up & Profile ----------

class UserSignUp(BaseModel):
    username: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=1, max_length=128)
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    contact_number: str = Field(min_length=1, max_length=32)
    tower: str = Field(min_length=1, max_length=32)
    unit_number: str = Field(min_length=1, max_length=16)
    is_rented: bool = False
    owner_name: str | None = Field(default=None, max_length=120)
    owner_contact_number: str | None = Field(default=None, max_length=32)


class UserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    email: EmailStr | None = None
    contact_number: str | None = Field(default=None, min_length=1, max_length=32)
    tower: str | None = Field(default=None, min_length=1, max_length=32)
    unit_number: str | None = Field(default=None, min_length=1, max_length=16)
    is_rented: bool | None = None
    owner_name: str | None = Field(default=None, max_length=120)
    owner_contact_number: str | None = Field(default=None, max_length=32)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(min_length=1, max_length=128)


class UserResponse(BaseModel):
    """Lightweight legacy response (login)."""
    username: str
    role: str

    class Config:
        from_attributes = True


class FullUserResponse(BaseModel):
    """Full profile response — used by /users/me and registration."""
    id: str
    username: str
    role: str
    name: str | None = None
    email: str | None = None
    contact_number: str | None = None
    tower: str | None = None
    unit_number: str | None = None
    is_rented: bool = False
    owner_name: str | None = None
    owner_contact_number: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
