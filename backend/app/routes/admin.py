import os
import sqlite3
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
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


@router.get("/backup/download")
async def download_backup(current_user: dict = Depends(get_current_user)):
    """Create a consistent SQLite snapshot and stream it as a .db download. Admin-only."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")

    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite:///"):
        raise HTTPException(status_code=500, detail="Only SQLite databases support backup via this endpoint")

    # strip "sqlite:///" — leaves a relative path (./society.db) or absolute (/data/society.db)
    db_path = db_url[len("sqlite:///"):]
    if not os.path.isfile(db_path):
        raise HTTPException(status_code=404, detail=f"Database file not found at: {db_path}")

    backup_folder = os.path.abspath(settings.BACKUP_FOLDER)
    os.makedirs(backup_folder, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"society_backup_{timestamp}.db"
    backup_path = os.path.join(backup_folder, backup_filename)

    # sqlite3.backup() produces a consistent snapshot even under concurrent writes
    src = sqlite3.connect(db_path)
    dst = sqlite3.connect(backup_path)
    src.backup(dst)
    dst.close()
    src.close()

    return FileResponse(
        backup_path,
        media_type="application/octet-stream",
        filename=backup_filename,
    )


# ---------- User verification ----------

@router.get("/pending-users")
async def list_pending_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return all accounts that are awaiting admin verification. Admin-only."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    users = (
        db.query(User)
        .filter(User.is_verified == False)  # noqa: E712
        .order_by(User.created_at.asc())
        .all()
    )
    return [
        {
            "id": u.id,
            "username": u.username,
            "name": u.name,
            "email": u.email,
            "contact_number": u.contact_number,
            "tower": u.tower,
            "unit_number": u.unit_number,
            "is_rented": u.is_rented,
            "owner_name": u.owner_name,
            "owner_contact_number": u.owner_contact_number,
            "created_at": u.created_at.isoformat() if u.created_at else None,
        }
        for u in users
    ]


@router.post("/verify-user/{user_id}")
async def verify_user_account(
    user_id: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Approve a pending resident account. Admin-only. Sends approval email to the user."""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if getattr(user, "is_verified", False):
        return {"message": f"Account '{user.username}' is already verified"}
    user.is_verified = True
    db.commit()
    try:
        from app.utils.registration_email import send_account_approved_email
        send_account_approved_email(user=user)
    except Exception:
        pass
    return {"message": f"Account '{user.username}' verified successfully"}
