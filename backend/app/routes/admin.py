import logging
import os
import shutil
import sqlite3
import tempfile
from datetime import datetime

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import engine, get_db
from app.models.user import User
from app.utils.backup_crypto import decrypt_bytes, encrypt_file
from app.utils.backup_scheduler import list_daily_backups, run_daily_backup
from app.utils.jwt_handler import get_current_user

log = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


def _require_admin(current_user: dict) -> None:
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")


def _resolve_db_path() -> str:
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite:///"):
        raise HTTPException(status_code=500, detail="Only SQLite databases are supported")
    return db_url[len("sqlite:///"):]


# ---------- Master reset ----------

@router.post("/reset-all")
async def master_reset(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete ALL transaction records. Admin-only."""
    _require_admin(current_user)
    db.execute(text("DELETE FROM coupon_tickets"))
    db.execute(text("DELETE FROM coupons"))
    db.execute(text("DELETE FROM subscriptions"))
    db.execute(text("DELETE FROM donations"))
    db.execute(text("DELETE FROM expenses"))
    db.commit()
    return {"message": "All transaction records deleted successfully"}


# ---------- Manual backup (encrypted download) ----------

@router.get("/backup/download")
async def download_backup(current_user: dict = Depends(get_current_user)):
    """Create an AES-encrypted SQLite snapshot and stream it for download. Admin-only.

    The downloaded .db.enc file can only be decrypted by the same portal
    instance (same SECRET_KEY).  Use /backup/restore to apply it.
    """
    _require_admin(current_user)

    db_path = _resolve_db_path()
    if not os.path.isfile(db_path):
        raise HTTPException(status_code=404, detail=f"Database file not found at: {db_path}")

    backup_folder = os.path.abspath(settings.BACKUP_FOLDER)
    os.makedirs(backup_folder, exist_ok=True)

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    raw_path = os.path.join(backup_folder, f"society_backup_{timestamp}.db")
    enc_path = os.path.join(backup_folder, f"society_backup_{timestamp}.db.enc")

    # Consistent snapshot via SQLite online backup API
    src = sqlite3.connect(db_path)
    dst = sqlite3.connect(raw_path)
    src.backup(dst)
    dst.close()
    src.close()

    # Encrypt and remove plaintext copy
    encrypt_file(raw_path, enc_path)
    os.remove(raw_path)

    return FileResponse(
        enc_path,
        media_type="application/octet-stream",
        filename=os.path.basename(enc_path),
    )


# ---------- Restore from encrypted backup ----------

@router.post("/backup/restore")
async def restore_backup(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """Restore the live database from an encrypted .db.enc backup file. Admin-only.

    Steps performed:
      1. Decrypt the uploaded file using the portal's SECRET_KEY.
      2. Validate the result is a readable SQLite database.
      3. Flush all active DB connections (engine.dispose).
      4. Atomically replace the live DB file with the restored snapshot.

    The app reconnects automatically on the next request.
    All data will reflect the state at the time the backup was taken.
    """
    _require_admin(current_user)

    ciphertext = await file.read()
    if not ciphertext:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    # Step 1 — decrypt
    try:
        plaintext = decrypt_bytes(ciphertext)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    # Step 2 — validate it's a real SQLite database before touching the live DB
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        tmp.write(plaintext)
        tmp_path = tmp.name

    try:
        conn = sqlite3.connect(tmp_path)
        conn.execute("SELECT name FROM sqlite_master LIMIT 1")
        conn.close()
    except Exception:
        os.remove(tmp_path)
        raise HTTPException(
            status_code=400,
            detail="The decrypted data is not a valid SQLite database. Aborting restore.",
        )

    db_path = _resolve_db_path()

    # Step 3 — flush connection pool so no handles are open on the live file
    engine.dispose()

    # Step 4 — atomic replace (same volume → os.replace is atomic on POSIX)
    try:
        os.replace(tmp_path, db_path)
    except Exception as exc:
        log.exception("Restore: failed to replace DB file")
        raise HTTPException(status_code=500, detail=f"Failed to write restored database: {exc}")

    log.info("Database restored from uploaded backup by %s", current_user.get("sub"))
    return {
        "message": (
            "Database restored successfully. "
            "All connections refreshed — the portal now reflects the backup snapshot."
        )
    }


# ---------- Daily backup management ----------

@router.get("/backup/daily-status")
async def daily_backup_status(current_user: dict = Depends(get_current_user)):
    """List available automated daily backups (newest first). Admin-only."""
    _require_admin(current_user)
    backups = list_daily_backups()
    return {
        "count": len(backups),
        "retention_days": 7,
        "backups": [
            {
                "filename": b["filename"],
                "size_kb": b["size_kb"],
                "created_at": b["created_at"],
            }
            for b in backups
        ],
    }


@router.post("/backup/run-now")
async def trigger_backup_now(current_user: dict = Depends(get_current_user)):
    """Manually trigger the daily backup job immediately. Admin-only."""
    _require_admin(current_user)
    result = run_daily_backup()
    if result:
        return {"message": "Backup completed successfully.", "path": os.path.basename(result)}
    raise HTTPException(status_code=500, detail="Backup job failed — check server logs.")


@router.get("/backup/daily/{filename}")
async def download_daily_backup(
    filename: str,
    current_user: dict = Depends(get_current_user),
):
    """Download a specific daily backup file. Admin-only."""
    _require_admin(current_user)
    if not filename.endswith(".db.enc") or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")
    backups = {b["filename"]: b["path"] for b in list_daily_backups()}
    if filename not in backups:
        raise HTTPException(status_code=404, detail="Backup not found")
    return FileResponse(
        backups[filename],
        media_type="application/octet-stream",
        filename=filename,
    )


# ---------- User verification ----------

@router.get("/pending-users")
async def list_pending_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Return accounts awaiting admin verification. Admin-only."""
    _require_admin(current_user)
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
    """Approve a pending resident account. Admin-only. Sends approval email."""
    _require_admin(current_user)
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
