from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func

from app.database import Base


class CommunityEvent(Base):
    """Society-wide event shown on the public Events Calendar page.

    Description is HTML produced by the TipTap rich-text editor; sanitised on
    render via DOMPurify in <SafeHtml>.
    """
    __tablename__ = "community_events"

    id = Column(String, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    start_date = Column(DateTime(timezone=True), index=True)
    end_date = Column(DateTime(timezone=True), nullable=True)
    image = Column(String, nullable=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
