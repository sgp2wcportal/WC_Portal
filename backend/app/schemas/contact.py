from datetime import datetime
from pydantic import BaseModel, Field


class ContactCreate(BaseModel):
    category: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=120)
    designation: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    contact_number: str = Field(min_length=1, max_length=50)


class ContactUpdate(BaseModel):
    category: str | None = Field(default=None, min_length=1, max_length=120)
    name: str | None = Field(default=None, min_length=1, max_length=120)
    designation: str | None = Field(default=None, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    contact_number: str | None = Field(default=None, min_length=1, max_length=50)


class ContactResponse(BaseModel):
    id: str
    category: str
    name: str
    designation: str | None = None
    description: str | None = None
    contact_number: str
    created_by: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
