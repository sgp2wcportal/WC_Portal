from sqlalchemy import Column, String, DateTime, Boolean, Enum as SQLEnum
from sqlalchemy.sql import func
from app.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    USER = "user"
    GENERIC = "generic"


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)  # bcrypt hash for new users; legacy plaintext for hardcoded demo accounts
    role = Column(SQLEnum(UserRole), default=UserRole.USER)

    # Profile fields (optional for legacy accounts; required at signup)
    name = Column(String, nullable=True)
    email = Column(String, index=True, nullable=True)
    contact_number = Column(String, nullable=True)
    tower = Column(String, index=True, nullable=True)
    unit_number = Column(String, index=True, nullable=True)
    is_rented = Column(Boolean, default=False)
    owner_name = Column(String, nullable=True)
    owner_contact_number = Column(String, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
