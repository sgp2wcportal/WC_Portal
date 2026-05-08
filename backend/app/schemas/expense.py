from datetime import datetime
from pydantic import BaseModel, Field


class ExpenseCreate(BaseModel):
    category: str = Field(min_length=1, max_length=64)
    occasion: str = Field(min_length=1, max_length=64)
    amount: float = Field(gt=0)
    paid_to: str = Field(min_length=1, max_length=120)
    description: str = ""
    expense_date: datetime | None = None


class ExpenseResponse(BaseModel):
    id: str
    category: str
    occasion: str
    amount: float
    paid_to: str
    description: str
    expense_date: datetime | None = None
    receipt_file: str | None = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


# ---------- Lookup option schemas ----------

class LookupOptionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)


class LookupOptionResponse(BaseModel):
    id: str
    name: str
    created_by: str | None = None
    created_at: datetime

    class Config:
        from_attributes = True
