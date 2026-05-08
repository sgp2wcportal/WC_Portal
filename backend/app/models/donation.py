from sqlalchemy import Column, String, Float, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Donation(Base):
    __tablename__ = "donations"

    id = Column(String, primary_key=True, index=True)
    donor_name = Column(String, index=True)
    donor_email = Column(String)
    donor_phone = Column(String)
    tower = Column(String, index=True, nullable=True)
    unit_number = Column(String, index=True, nullable=True)
    amount = Column(Float, index=True)
    donation_type = Column(String)  # e.g., "Donation", "Sponsorship"
    description = Column(Text)
    payment_method = Column(String, default="upi")  # 'upi' | 'cash'
    txn_reference = Column(String, index=True, nullable=True)
    payer_upi_id = Column(String, nullable=True)
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String, nullable=True)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
