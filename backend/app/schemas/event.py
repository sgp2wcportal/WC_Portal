from datetime import datetime

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: str = ""              # HTML from RichTextEditor
    start_date: datetime
    end_date: datetime | None = None   # absent → single-day event


class EventUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = None
    start_date: datetime | None = None
    end_date: datetime | None = None


class EventResponse(BaseModel):
    id: str
    title: str
    description: str | None = None
    start_date: datetime
    end_date: datetime | None = None
    image: str | None = None
    created_by: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
