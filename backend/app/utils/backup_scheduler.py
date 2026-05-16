"""Daily automated DB backup scheduler with 7-day rolling retention.

Runs once per day at 02:00 server time via APScheduler BackgroundScheduler.
Each backup is an AES-encrypted SQLite snapshot (.db.enc).
Backups older than 7 days are automatically pruned on each successful run.
"""
from __future__ import annotations

import logging
import os
import sqlite3
from datetime import datetime, timedelta

from apscheduler.schedulers.background import BackgroundScheduler

from app.config import settings
from app.utils.backup_crypto import encrypt_file

log = logging.getLogger(__name__)

_scheduler: BackgroundScheduler | None = None
_DAILY_SUBDIR = "daily"


# ---------- Internal helpers ----------

def _daily_folder() -> str:
    folder = os.path.join(os.path.abspath(settings.BACKUP_FOLDER), _DAILY_SUBDIR)
    os.makedirs(folder, exist_ok=True)
    return folder


def _db_path() -> str:
    db_url = settings.DATABASE_URL
    if not db_url.startswith("sqlite:///"):
        raise RuntimeError("Scheduled backup only supports SQLite databases")
    return db_url[len("sqlite:///"):]


# ---------- Core backup job ----------

def run_daily_backup() -> str | None:
    """
    1. Create a consistent SQLite snapshot.
    2. Encrypt it (AES via Fernet).
    3. Delete the plaintext copy immediately.
    4. Prune .db.enc files older than 7 days.

    Returns the path of the new encrypted backup, or None on failure.
    """
    try:
        db_path = _db_path()
        if not os.path.isfile(db_path):
            log.error("Daily backup: live DB not found at %s", db_path)
            return None

        folder = _daily_folder()
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        raw_path = os.path.join(folder, f"daily_{timestamp}.db")
        enc_path = os.path.join(folder, f"daily_{timestamp}.db.enc")

        # Consistent SQLite snapshot (online backup API — safe under concurrent writes)
        src = sqlite3.connect(db_path)
        dst = sqlite3.connect(raw_path)
        src.backup(dst)
        dst.close()
        src.close()

        # Encrypt and immediately remove the plaintext snapshot
        encrypt_file(raw_path, enc_path)
        os.remove(raw_path)

        # Prune backups older than 7 days
        cutoff = datetime.now() - timedelta(days=7)
        for fname in os.listdir(folder):
            if not fname.endswith(".db.enc"):
                continue
            fpath = os.path.join(folder, fname)
            mtime = datetime.fromtimestamp(os.path.getmtime(fpath))
            if mtime < cutoff:
                os.remove(fpath)
                log.info("Daily backup: pruned %s (older than 7 days)", fname)

        log.info("Daily backup success: %s", enc_path)
        return enc_path

    except Exception:
        log.exception("Daily backup failed")
        return None


# ---------- Scheduler lifecycle ----------

def start_scheduler() -> None:
    global _scheduler
    if _scheduler is not None:
        return
    _scheduler = BackgroundScheduler(timezone="Asia/Kolkata")
    _scheduler.add_job(
        run_daily_backup,
        trigger="cron",
        hour=2,
        minute=0,
        id="daily_db_backup",
        replace_existing=True,
    )
    _scheduler.start()
    log.info("Daily backup scheduler started — runs at 02:00 IST every day")


def stop_scheduler() -> None:
    global _scheduler
    if _scheduler and _scheduler.running:
        _scheduler.shutdown(wait=False)
    _scheduler = None


# ---------- Status helpers (used by admin route) ----------

def list_daily_backups() -> list[dict]:
    """Return metadata for available daily backups, newest first."""
    folder = _daily_folder()
    result = []
    for fname in sorted(os.listdir(folder), reverse=True):
        if not fname.endswith(".db.enc"):
            continue
        fpath = os.path.join(folder, fname)
        result.append({
            "filename": fname,
            "path": fpath,
            "size_kb": round(os.path.getsize(fpath) / 1024, 1),
            "created_at": datetime.fromtimestamp(os.path.getmtime(fpath)).isoformat(),
        })
    return result
