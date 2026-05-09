from pydantic import BaseModel
from datetime import datetime

class AnnouncementCreate(BaseModel):
    title: str
    content: str
    visible_until: datetime | None = None

class AnnouncementUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    is_active: bool | None = None
    visible_until: datetime | None = None

class AnnouncementResponse(BaseModel):
    id: str
    title: str
    content: str
    created_by: str
    is_active: bool
    image: str | None = None
    visible_until: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True
