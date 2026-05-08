import uuid
from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.expense import Expense, ExpenseCategoryOption, ExpenseOccasionOption


# ---------- Expenses ----------

def create_expense(
    db: Session,
    *,
    category: str,
    occasion: str,
    amount: float,
    paid_to: str,
    description: str,
    created_by: str,
    expense_date: datetime | None = None,
    receipt_file: str | None = None,
) -> Expense:
    expense = Expense(
        id=str(uuid.uuid4()),
        category=category,
        occasion=occasion,
        amount=amount,
        paid_to=paid_to,
        description=description,
        expense_date=expense_date or datetime.now(timezone.utc),
        receipt_file=receipt_file,
        created_by=created_by,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


def get_expenses(db: Session, skip: int = 0, limit: int = 1000):
    return (
        db.query(Expense)
        .order_by(Expense.expense_date.desc().nullslast(), Expense.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_expense_by_id(db: Session, expense_id: str):
    return db.query(Expense).filter(Expense.id == expense_id).first()


def update_expense(db: Session, expense_id: str, **kwargs):
    expense = get_expense_by_id(db, expense_id)
    if not expense:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(expense, key):
            setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return expense


def delete_expense(db: Session, expense_id: str):
    expense = get_expense_by_id(db, expense_id)
    if expense:
        db.delete(expense)
        db.commit()
        return True
    return False


def get_expense_analytics(db: Session):
    total_expense = db.query(func.sum(Expense.amount)).scalar() or 0

    by_category = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total'),
    ).group_by(Expense.category).all()

    by_occasion = db.query(
        Expense.occasion,
        func.sum(Expense.amount).label('total'),
    ).group_by(Expense.occasion).all()

    return {
        "total": total_expense,
        "by_category": [{"category": cat, "amount": amt} for cat, amt in by_category],
        "by_occasion": [{"occasion": occ, "amount": amt} for occ, amt in by_occasion],
    }


# ---------- Lookup options (categories / occasions) ----------

class DuplicateOption(Exception):
    pass


class OptionInUse(Exception):
    pass


def list_categories(db: Session):
    return db.query(ExpenseCategoryOption).order_by(ExpenseCategoryOption.name).all()


def list_occasions(db: Session):
    return db.query(ExpenseOccasionOption).order_by(ExpenseOccasionOption.name).all()


def add_category(db: Session, *, name: str, created_by: str | None) -> ExpenseCategoryOption:
    option = ExpenseCategoryOption(id=str(uuid.uuid4()), name=name.strip(), created_by=created_by)
    db.add(option)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateOption(name)
    db.refresh(option)
    return option


def add_occasion(db: Session, *, name: str, created_by: str | None) -> ExpenseOccasionOption:
    option = ExpenseOccasionOption(id=str(uuid.uuid4()), name=name.strip(), created_by=created_by)
    db.add(option)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateOption(name)
    db.refresh(option)
    return option


def delete_category(db: Session, option_id: str) -> bool:
    option = db.query(ExpenseCategoryOption).filter(ExpenseCategoryOption.id == option_id).first()
    if not option:
        return False
    in_use = db.query(Expense).filter(Expense.category == option.name).first()
    if in_use:
        raise OptionInUse(option.name)
    db.delete(option)
    db.commit()
    return True


def delete_occasion(db: Session, option_id: str) -> bool:
    option = db.query(ExpenseOccasionOption).filter(ExpenseOccasionOption.id == option_id).first()
    if not option:
        return False
    in_use = db.query(Expense).filter(Expense.occasion == option.name).first()
    if in_use:
        raise OptionInUse(option.name)
    db.delete(option)
    db.commit()
    return True


def _rename_lookup(db: Session, model, expense_field, *, option_id: str, new_name: str):
    option = db.query(model).filter(model.id == option_id).first()
    if not option:
        return None
    cleaned = (new_name or "").strip()
    if not cleaned:
        raise ValueError("Name cannot be blank")
    if cleaned == option.name:
        return option
    old_name = option.name
    option.name = cleaned
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise DuplicateOption(cleaned)
    db.query(Expense).filter(expense_field == old_name).update(
        {expense_field: cleaned}, synchronize_session=False,
    )
    db.commit()
    db.refresh(option)
    return option


def rename_category(db: Session, option_id: str, *, new_name: str):
    return _rename_lookup(db, ExpenseCategoryOption, Expense.category, option_id=option_id, new_name=new_name)


def rename_occasion(db: Session, option_id: str, *, new_name: str):
    return _rename_lookup(db, ExpenseOccasionOption, Expense.occasion, option_id=option_id, new_name=new_name)


def seed_default_lookups(db: Session) -> None:
    """Idempotent seed — fills empty lookup tables with reasonable defaults."""
    if db.query(ExpenseCategoryOption).first() is None:
        defaults = [
            "Miscellaneous", "Decorator", "Caterer", "Internal Meetings", "Maintenance",
        ]
        for name in defaults:
            db.add(ExpenseCategoryOption(id=str(uuid.uuid4()), name=name))
    if db.query(ExpenseOccasionOption).first() is None:
        defaults = [
            "Miscellaneous", "Internal Meeting", "Society Meeting",
            "Ganesh Puja", "Durga Puja", "Diwali", "Annual Event",
        ]
        for name in defaults:
            db.add(ExpenseOccasionOption(id=str(uuid.uuid4()), name=name))
    db.commit()
