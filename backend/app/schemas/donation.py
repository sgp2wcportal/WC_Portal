from pydantic import BaseModel, EmailStr, Field
from datetime import datetime


class DonationCreate(BaseModel):
    donor_name: str = Field(min_length=1, max_length=120)
    donor_email: EmailStr
    donor_phone: str = Field(min_length=1, max_length=32)
    tower: str = Field(min_length=1, max_length=32)
    unit_number: str = Field(min_length=1, max_length=16)
    amount: float = Field(gt=0)
    donation_type: str = Field(min_length=1, max_length=64)
    description: str = ""
    payment_method: str = Field(default="upi", pattern="^(upi|cash)$")
    txn_reference: str | None = Field(default=None, max_length=64)
    payer_upi_id: str | None = Field(default=None, max_length=128)


class DonationResponse(BaseModel):
    id: str
    donor_name: str
    donor_email: str
    donor_phone: str
    tower: str | None = None
    unit_number: str | None = None
    amount: float
    donation_type: str
    description: str
    payment_method: str = "upi"
    txn_reference: str | None = None
    payer_upi_id: str | None = None
    is_verified: bool = False
    verified_at: datetime | None = None
    verified_by: str | None = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True
