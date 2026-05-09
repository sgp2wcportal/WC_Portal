from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import get_db
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/reset-all")
async def master_reset(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete ALL transaction records (subscriptions, donations, expenses, food coupons).
    Admin-only. Use to wipe test data before go-live."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required for master reset")

    db.execute(text("DELETE FROM coupon_tickets"))
    db.execute(text("DELETE FROM coupons"))
    db.execute(text("DELETE FROM subscriptions"))
    db.execute(text("DELETE FROM donations"))
    db.execute(text("DELETE FROM expenses"))
    db.commit()

    return {"message": "All transaction records deleted successfully"}
