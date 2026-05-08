from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class CouponOccasionOption(Base):
    """Admin-managed list of festive occasions (Durga Puja, Diwali, …)."""
    __tablename__ = "coupon_occasions"
    __table_args__ = (UniqueConstraint("name", name="uq_coupon_occasion_name"),)

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class CouponMenu(Base):
    __tablename__ = "coupon_menus"

    id = Column(String, primary_key=True, index=True)
    event_name = Column(String, index=True, unique=True)
    event_date = Column(DateTime(timezone=True), nullable=True)
    occasion = Column(String, index=True, nullable=True)
    veg_price = Column(Float)            # adult
    nonveg_price = Column(Float)         # adult
    veg_kid_price = Column(Float, nullable=True)
    nonveg_kid_price = Column(Float, nullable=True)
    veg_menu = Column(Text)              # may contain HTML from rich-text editor
    nonveg_menu = Column(Text)           # may contain HTML from rich-text editor
    veg_image = Column(String, nullable=True)
    nonveg_image = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Coupon(Base):
    """A booking record. Holds a list of individual tickets."""
    __tablename__ = "coupons"

    id = Column(String, primary_key=True, index=True)
    flat_number = Column(String, index=True)        # legacy / derived "{tower}-{unit_number}"
    tower = Column(String, index=True, nullable=True)
    unit_number = Column(String, index=True, nullable=True)
    contact_number = Column(String, nullable=True)
    email = Column(String, index=True)
    event_name = Column(String, index=True)
    pax = Column(Integer, default=0)
    veg_count = Column(Integer, default=0)        # adult veg
    nonveg_count = Column(Integer, default=0)     # adult non-veg
    veg_kid_count = Column(Integer, default=0)
    nonveg_kid_count = Column(Integer, default=0)
    payment_method = Column(String, default="upi")  # 'upi' | 'cash'
    total_amount = Column(Float)
    qr_code_path = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    payer_upi_id = Column(String, nullable=True)
    txn_reference = Column(String, index=True, nullable=True)
    payment_verified = Column(Boolean, default=False)
    payment_verified_at = Column(DateTime(timezone=True), nullable=True)
    payment_verified_by = Column(String, nullable=True)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    verified_at = Column(DateTime(timezone=True), nullable=True)

    tickets = relationship(
        "CouponTicket",
        back_populates="booking",
        cascade="all, delete-orphan",
        order_by="CouponTicket.created_at",
    )


class CouponTicket(Base):
    """One ticket = one meal. Each has its own QR and used/unused flag."""
    __tablename__ = "coupon_tickets"

    id = Column(String, primary_key=True, index=True)
    booking_id = Column(String, ForeignKey("coupons.id", ondelete="CASCADE"), index=True)
    event_name = Column(String, index=True)
    ticket_type = Column(String)  # 'veg' | 'nonveg'
    is_kid = Column(Boolean, default=False)
    qr_code_path = Column(String, nullable=True)
    is_used = Column(Boolean, default=False)
    used_at = Column(DateTime(timezone=True), nullable=True)
    used_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    booking = relationship("Coupon", back_populates="tickets")
