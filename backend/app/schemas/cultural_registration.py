from datetime import datetime
from pydantic import BaseModel, Field

CULTURAL_CATEGORIES = [
    "Solo Singer",
    "Group Singing",
    "Solo Dance",
    "Group Dance",
    "Acting",
    "Others",
]


class CulturalRegistrationCreate(BaseModel):
    participant_name: str = Field(min_length=1, max_length=150)
    tower: str = Field(min_length=1, max_length=32)
    unit_number: str = Field(min_length=1, max_length=16)
    contact_number: str = Field(min_length=1, max_length=32)
    email: str | None = None
    event_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=60)
    num_participants: int = Field(default=1, ge=1)
    description: str | None = Field(default=None, max_length=500)


class CulturalRegistrationUpdate(BaseModel):
    participant_name: str | None = Field(default=None, min_length=1, max_length=150)
    tower: str | None = Field(default=None, min_length=1, max_length=32)
    unit_number: str | None = Field(default=None, min_length=1, max_length=16)
    contact_number: str | None = Field(default=None, min_length=1, max_length=32)
    email: str | None = None
    event_name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=60)
    num_participants: int | None = Field(default=None, ge=1)
    description: str | None = Field(default=None, max_length=500)


class CulturalRegistrationResponse(BaseModel):
    id: str
    participant_name: str
    tower: str
    unit_number: str
    contact_number: str
    email: str | None = None
    event_name: str
    category: str
    num_participants: int
    description: str | None = None
    created_by: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
