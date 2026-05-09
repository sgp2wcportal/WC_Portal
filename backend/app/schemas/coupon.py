from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class CouponMenuCreate(BaseModel):
    event_name: str
    event_date: datetime | None = None
    occasion: str | None = None
    veg_price: float
    nonveg_price: float
    veg_kid_price: float | None = None
    nonveg_kid_price: float | None = None
    veg_menu: str
    nonveg_menu: str


class CouponMenuUpdate(BaseModel):
    event_name: str | None = None
    event_date: datetime | None = None
    occasion: str | None = None
    veg_price: float | None = None
    nonveg_price: float | None = None
    veg_kid_price: float | None = None
    nonveg_kid_price: float | None = None
    veg_menu: str | None = None
    nonveg_menu: str | None = None
    is_active: bool | None = None


class CouponMenuResponse(BaseModel):
    id: str
    event_name: str
    event_date: datetime | None = None
    occasion: str | None = None
    veg_price: float
    nonveg_price: float
    veg_kid_price: float | None = None
    nonveg_kid_price: float | None = None
    veg_menu: str
    nonveg_menu: str
    veg_image: str | None = None
    nonveg_image: str | None = None
    is_active: bool = True
    created_at: datetime

    class Config:
        from_attributes = True


class CouponCreate(BaseModel):
    tower: str = Field(min_length=1, max_length=32)
    unit_number: str = Field(min_length=1, max_length=16)
    contact_number: str = Field(min_length=1, max_length=32)
    email: EmailStr
    event_name: str
    pax: int = Field(ge=1)
    veg_count: int = Field(ge=0, default=0)
    nonveg_count: int = Field(ge=0, default=0)
    veg_kid_count: int = Field(ge=0, default=0)
    nonveg_kid_count: int = Field(ge=0, default=0)
    payment_method: str = Field(default="upi", pattern="^(upi|cash)$")
    txn_reference: str | None = Field(default=None, max_length=64)
    payer_upi_id: str | None = Field(default=None, max_length=128)


class CouponTicketResponse(BaseModel):
    id: str
    booking_id: str
    event_name: str
    ticket_type: str
    is_kid: bool = False
    qr_code_path: str | None = None
    is_used: bool
    used_at: datetime | None = None
    used_by: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class CouponResponse(BaseModel):
    id: str
    flat_number: str
    tower: str | None = None
    unit_number: str | None = None
    contact_number: str | None = None
    email: str
    event_name: str
    pax: int
    veg_count: int
    nonveg_count: int
    veg_kid_count: int = 0
    nonveg_kid_count: int = 0
    payment_method: str = "upi"
    total_amount: float
    qr_code_path: str | None = None
    is_verified: bool
    txn_reference: str | None = None
    payer_upi_id: str | None = None
    payment_verified: bool = False
    payment_verified_at: datetime | None = None
    created_at: datetime
    tickets: list[CouponTicketResponse] = []
    delivery: dict | None = None

    class Config:
        from_attributes = True


class PaymentInfoResponse(BaseModel):
    upi_id: str
    upi_name: str
    upi_uri: str


class TicketVerifyRequest(BaseModel):
    """Accepts either a raw ticket id or a scanned QR payload (`TICKET:<id>`)."""
    code: str


class CouponUpdate(BaseModel):
    flat_number: str | None = None
    tower: str | None = None
    unit_number: str | None = None
    contact_number: str | None = None
    email: EmailStr | None = None
    pax: int | None = Field(default=None, ge=1)
    veg_count: int | None = Field(default=None, ge=0)
    nonveg_count: int | None = Field(default=None, ge=0)
    veg_kid_count: int | None = Field(default=None, ge=0)
    nonveg_kid_count: int | None = Field(default=None, ge=0)
    payment_method: str | None = Field(default=None, pattern="^(upi|cash)$")
    txn_reference: str | None = Field(default=None, max_length=64)
    payer_upi_id: str | None = Field(default=None, max_length=128)
    payment_verified: bool | None = None


class EventDashboardTotals(BaseModel):
    bookings: int
    pax: int
    veg: int
    nonveg: int
    veg_kid: int = 0
    nonveg_kid: int = 0
    veg_used: int
    nonveg_used: int
    veg_kid_used: int = 0
    nonveg_kid_used: int = 0
    veg_remaining: int
    nonveg_remaining: int
    veg_kid_remaining: int = 0
    nonveg_kid_remaining: int = 0
    total_amount: float


class EventDashboardResponse(BaseModel):
    event_name: str
    totals: EventDashboardTotals
    bookings: list[CouponResponse]


class OccasionOptionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class OccasionOptionResponse(BaseModel):
    id: str
    name: str
    created_by: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
