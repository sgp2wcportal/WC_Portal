from sqlalchemy import Column, String, DateTime, Integer
from sqlalchemy.sql import func
from app.database import Base


class CulturalRegistration(Base):
    __tablename__ = "cultural_registrations"

    id = Column(String, primary_key=True, index=True)
    participant_name = Column(String, nullable=False)
    tower = Column(String, nullable=False)
    unit_number = Column(String, nullable=False)
    contact_number = Column(String, nullable=False)
    email = Column(String, nullable=True)
    event_name = Column(String, nullable=False)
    category = Column(String, nullable=False)   # Solo Singer, Group Singing, etc.
    num_participants = Column(Integer, default=1)
    description = Column(String, nullable=True)  # optional notes / song/act title
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
