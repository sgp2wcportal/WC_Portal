from sqlalchemy import Column, String, Float, DateTime, Text, UniqueConstraint
from sqlalchemy.sql import func
from app.database import Base


class ExpenseCategoryOption(Base):
    """Admin-managed list of expense categories. Free-form names."""
    __tablename__ = "expense_categories"
    __table_args__ = (UniqueConstraint("name", name="uq_expense_category_name"),)

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ExpenseOccasionOption(Base):
    """Admin-managed list of expense occasions. Free-form names."""
    __tablename__ = "expense_occasions"
    __table_args__ = (UniqueConstraint("name", name="uq_expense_occasion_name"),)

    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    created_by = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, index=True)
    category = Column(String, index=True)
    occasion = Column(String, index=True)
    amount = Column(Float, index=True)
    paid_to = Column(String, index=True)
    description = Column(Text)
    expense_date = Column(DateTime(timezone=True), nullable=True, index=True)
    receipt_file = Column(String, nullable=True)
    created_by = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
