from sqlalchemy import Column, String, DateTime, Text, Boolean
from sqlalchemy.sql import func
from app.database import Base

class Announcement(Base):
    __tablename__ = "announcements"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    created_by = Column(String)
    is_active = Column(Boolean, default=True)
    image = Column(String, nullable=True)
    visible_until = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
