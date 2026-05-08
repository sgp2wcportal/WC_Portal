from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class SubscriptionCreate(BaseModel):
    owner_name: str = Field(min_length=1, max_length=120)
    contact_number: str = Field(min_length=1, max_length=32)
    email: EmailStr
    tower: str = Field(min_length=1, max_length=32)
    unit_number: str = Field(min_length=1, max_length=16)
    subscription_amount: float = Field(gt=0)
    family_members: int = 0
    is_rented: bool = False
    landlord_name: str | None = Field(default=None, max_length=120)
    landlord_contact: str | None = Field(default=None, max_length=32)
    payment_method: str = Field(default="upi", pattern="^(upi|cash)$")
    txn_reference: str | None = Field(default=None, max_length=64)
    payer_upi_id: str | None = Field(default=None, max_length=128)


class SubscriptionResponse(BaseModel):
    id: str
    owner_name: str
    contact_number: str
    email: str
    tower: str | None = None
    unit_number: str
    subscription_amount: float
    family_members: int
    is_rented: bool
    landlord_name: str | None = None
    landlord_contact: str | None = None
    payment_method: str = "upi"
    txn_reference: str | None = None
    payer_upi_id: str | None = None
    status: str
    is_verified: bool = False
    verified_at: datetime | None = None
    verified_by: str | None = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True
