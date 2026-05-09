from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, File, Form, HTTPException, Response, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.expense import (
    ExpenseCreate,
    ExpenseResponse,
    LookupOptionCreate,
    LookupOptionResponse,
)
from app.services.expense_service import (
    DuplicateOption,
    OptionInUse,
    add_category,
    add_occasion,
    create_expense,
    delete_category,
    delete_occasion,
    get_expense_analytics,
    get_expense_by_id,
    get_expenses,
    list_categories,
    list_occasions,
    rename_category,
    rename_occasion,
)
from app.utils.excel_export import rows_to_xlsx
from app.utils.file_handler import save_upload_file
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


def _require_admin_or_generic(current_user: dict):
    if current_user.get("role") not in ("admin", "generic"):
        raise HTTPException(status_code=403, detail="Admin or generic role required")


def _parse_date(raw: str | None) -> datetime | None:
    if not raw:
        return None
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError:
        return None


# ---------- Lookup options (admin-managed dropdown values) ----------

@router.get("/categories/", response_model=list[LookupOptionResponse])
async def list_category_options(db: Session = Depends(get_db)):
    return list_categories(db)


@router.post("/categories/", response_model=LookupOptionResponse)
async def add_category_option(
    payload: LookupOptionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        return add_category(db, name=payload.name, created_by=current_user["sub"])
    except DuplicateOption:
        raise HTTPException(status_code=409, detail=f"Category '{payload.name}' already exists")


@router.delete("/categories/{option_id}")
async def delete_category_option(
    option_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        ok = delete_category(db, option_id)
    except OptionInUse as exc:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete '{exc}': existing expenses still use this category",
        )
    if not ok:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Deleted"}


@router.patch("/categories/{option_id}", response_model=LookupOptionResponse)
async def rename_category_option(
    option_id: str,
    payload: LookupOptionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        option = rename_category(db, option_id, new_name=payload.name)
    except DuplicateOption:
        raise HTTPException(status_code=409, detail=f"Category '{payload.name}' already exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not option:
        raise HTTPException(status_code=404, detail="Category not found")
    return option


@router.get("/occasions/", response_model=list[LookupOptionResponse])
async def list_occasion_options(db: Session = Depends(get_db)):
    return list_occasions(db)


@router.post("/occasions/", response_model=LookupOptionResponse)
async def add_occasion_option(
    payload: LookupOptionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        return add_occasion(db, name=payload.name, created_by=current_user["sub"])
    except DuplicateOption:
        raise HTTPException(status_code=409, detail=f"Occasion '{payload.name}' already exists")


@router.delete("/occasions/{option_id}")
async def delete_occasion_option(
    option_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        ok = delete_occasion(db, option_id)
    except OptionInUse as exc:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete '{exc}': existing expenses still use this occasion",
        )
    if not ok:
        raise HTTPException(status_code=404, detail="Occasion not found")
    return {"message": "Deleted"}


@router.patch("/occasions/{option_id}", response_model=LookupOptionResponse)
async def rename_occasion_option(
    option_id: str,
    payload: LookupOptionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        option = rename_occasion(db, option_id, new_name=payload.name)
    except DuplicateOption:
        raise HTTPException(status_code=409, detail=f"Occasion '{payload.name}' already exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not option:
        raise HTTPException(status_code=404, detail="Occasion not found")
    return option


# ---------- Expenses ----------

@router.post("/", response_model=ExpenseResponse)
async def create_new_expense(
    expense: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return create_expense(
        db,
        category=expense.category,
        occasion=expense.occasion,
        amount=expense.amount,
        paid_to=expense.paid_to,
        description=expense.description,
        expense_date=expense.expense_date,
        created_by=current_user["sub"],
    )


@router.post("/with-receipt", response_model=ExpenseResponse)
async def create_expense_with_receipt(
    category: str = Form(...),
    occasion: str = Form(...),
    amount: float = Form(...),
    paid_to: str = Form(...),
    description: str = Form(""),
    expense_date: str | None = Form(None),
    receipt: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    receipt_file = None
    if receipt:
        content = await receipt.read()
        receipt_file = save_upload_file(content, original_filename=receipt.filename)

    return create_expense(
        db,
        category=category,
        occasion=occasion,
        amount=float(amount),
        paid_to=paid_to,
        description=description,
        expense_date=_parse_date(expense_date),
        created_by=current_user["sub"],
        receipt_file=receipt_file,
    )


@router.get("/", response_model=list[ExpenseResponse])
async def list_expenses(skip: int = 0, limit: int = 1000, db: Session = Depends(get_db)):
    return get_expenses(db, skip, limit)


@router.get("/analytics")
async def expense_analytics(db: Session = Depends(get_db)):
    return get_expense_analytics(db)


@router.get("/export.xlsx")
async def export_expenses(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Download all expenses as an Excel workbook (admin/generic only)."""
    _require_admin_or_generic(current_user)
    rows = [
        {
            "category": e.category,
            "occasion": e.occasion,
            "amount": e.amount,
            "paid_to": e.paid_to,
            "description": e.description or "",
            "expense_date": e.expense_date,
            "created_by": e.created_by,
            "created_at": e.created_at,
        }
        for e in get_expenses(db, skip=0, limit=10_000)
    ]
    columns = [
        ("Category", "category"),
        ("Occasion", "occasion"),
        ("Amount (INR)", "amount"),
        ("Paid To", "paid_to"),
        ("Description", "description"),
        ("Expense Date", "expense_date"),
        ("Recorded By", "created_by"),
        ("Recorded At", "created_at"),
    ]
    data = rows_to_xlsx(sheet_title="Expenses", columns=columns, rows=rows)
    fname = f"expenses_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(fname)}"},
    )


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(expense_id: str, db: Session = Depends(get_db)):
    expense = get_expense_by_id(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.delete("/{expense_id}")
async def delete_expense_record(
    expense_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    if not delete_expense(db, expense_id):
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Deleted"}
