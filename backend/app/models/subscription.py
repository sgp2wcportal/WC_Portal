from sqlalchemy import Column, String, Float, DateTime, Integer, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(String, primary_key=True, index=True)
    owner_name = Column(String, index=True)  # full name of the resident filing the subscription
    contact_number = Column(String)
    email = Column(String)
    tower = Column(String, index=True, nullable=True)
    unit_number = Column(String, index=True)
    subscription_amount = Column(Float, index=True)
    family_members = Column(Integer)
    is_rented = Column(Boolean, default=False)
    landlord_name = Column(String, nullable=True)
    landlord_contact = Column(String, nullable=True)
    payment_method = Column(String, default="upi")  # 'upi' | 'cash'
    txn_reference = Column(String, index=True, nullable=True)
    payer_upi_id = Column(String, nullable=True)
    status = Column(String, default="active")
    is_verified = Column(Boolean, default=False)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    verified_by = Column(String, nullable=True)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
