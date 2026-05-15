import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from sqlalchemy import inspect, text

from app.config import settings
from app.database import Base, engine
from app.routes import admin, announcements, auth, contacts, coupons, cultural, donations, events, expenses, payments, reports, subscriptions, users

# Create tables
Base.metadata.create_all(bind=engine)


def _ensure_columns(table: str, additions: list[tuple[str, str]]) -> None:
    """Add columns to an existing table if missing. SQLite-compatible no-op migration."""
    insp = inspect(engine)
    if table not in insp.get_table_names():
        return
    existing = {col["name"] for col in insp.get_columns(table)}
    with engine.begin() as conn:
        for name, ddl in additions:
            if name not in existing:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {name} {ddl}"))


_ensure_columns("coupons", [
    ("payer_upi_id", "VARCHAR"),
    ("txn_reference", "VARCHAR"),
    ("payment_verified", "BOOLEAN DEFAULT 0"),
    ("payment_verified_at", "DATETIME"),
    ("payment_verified_by", "VARCHAR"),
    ("tower", "VARCHAR"),
    ("unit_number", "VARCHAR"),
    ("contact_number", "VARCHAR"),
    ("veg_kid_count", "INTEGER DEFAULT 0"),
    ("nonveg_kid_count", "INTEGER DEFAULT 0"),
    ("payment_method", "VARCHAR DEFAULT 'upi'"),
])

_ensure_columns("coupon_menus", [
    ("occasion", "VARCHAR"),
    ("veg_kid_price", "FLOAT"),
    ("nonveg_kid_price", "FLOAT"),
])

_ensure_columns("coupon_tickets", [
    ("is_kid", "BOOLEAN DEFAULT 0"),
])

_ensure_columns("subscriptions", [
    ("tower", "VARCHAR"),
    ("landlord_name", "VARCHAR"),
    ("landlord_contact", "VARCHAR"),
    ("is_verified", "BOOLEAN DEFAULT 0"),
    ("verified_at", "DATETIME"),
    ("verified_by", "VARCHAR"),
    ("payment_method", "VARCHAR DEFAULT 'upi'"),
    ("txn_reference", "VARCHAR"),
    ("payer_upi_id", "VARCHAR"),
])

_ensure_columns("donations", [
    ("tower", "VARCHAR"),
    ("unit_number", "VARCHAR"),
    ("is_verified", "BOOLEAN DEFAULT 0"),
    ("verified_at", "DATETIME"),
    ("verified_by", "VARCHAR"),
    ("payment_method", "VARCHAR DEFAULT 'upi'"),
    ("txn_reference", "VARCHAR"),
    ("payer_upi_id", "VARCHAR"),
])

_ensure_columns("expenses", [
    ("expense_date", "DATETIME"),
])

_ensure_columns("announcements", [
    ("image", "VARCHAR"),
])

_ensure_columns("users", [
    ("name", "VARCHAR"),
    ("email", "VARCHAR"),
    ("contact_number", "VARCHAR"),
    ("tower", "VARCHAR"),
    ("unit_number", "VARCHAR"),
    ("is_rented", "BOOLEAN DEFAULT 0"),
    ("owner_name", "VARCHAR"),
    ("owner_contact_number", "VARCHAR"),
    ("is_verified", "BOOLEAN DEFAULT 0"),
])


def _seed_expense_lookups() -> None:
    """Populate expense category/occasion lookup tables on first boot."""
    from app.database import SessionLocal
    from app.services.expense_service import seed_default_lookups
    with SessionLocal() as db:
        seed_default_lookups(db)


def _seed_coupon_occasions() -> None:
    from app.database import SessionLocal
    from app.services.coupon_service import seed_default_coupon_occasions
    with SessionLocal() as db:
        seed_default_coupon_occasions(db)


def _seed_demo_user_accounts() -> None:
    """Ensure admin/user/generic exist with bcrypt-hashed passwords."""
    from app.database import SessionLocal
    from app.services.auth_service import seed_demo_accounts
    with SessionLocal() as db:
        seed_demo_accounts(db)


_seed_expense_lookups()
_seed_coupon_occasions()
_seed_demo_user_accounts()

# Initialize FastAPI app
app = FastAPI(
    title="Siddha Galaxia Phase 2 Welfare Committee Portal",
    description="Residential Society Management System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(admin.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(expenses.router)
app.include_router(donations.router)
app.include_router(subscriptions.router)
app.include_router(announcements.router)
app.include_router(coupons.router)
app.include_router(events.router)
app.include_router(payments.router)
app.include_router(reports.router)
app.include_router(contacts.router)
app.include_router(cultural.router)

# Serve uploaded files (QR codes, menu images, receipts) from /storage/<...>
storage_root = os.path.abspath(settings.UPLOAD_FOLDER)
for sub in ("qrcodes", "menu_images", "receipts", "payment_qrs", "event_images", "announcement_images"):
    os.makedirs(os.path.join(storage_root, sub), exist_ok=True)
app.mount("/storage", StaticFiles(directory=storage_root), name="storage")

@app.get("/api/health")
async def health():
    return {"status": "ok"}


# Serve the built frontend (Vite dist) when present. In dev this directory
# usually doesn't exist (Vite serves the SPA itself on :3000); in the Docker
# image it's at /app/frontend/dist.
_frontend_dir = os.environ.get("FRONTEND_DIR") or os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist")
)
if os.path.isdir(_frontend_dir):
    _assets_dir = os.path.join(_frontend_dir, "assets")
    if os.path.isdir(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="frontend-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # /api/* and /storage/* are handled by routers/mounts above; if we get
        # here it's a real 404 for those prefixes.
        if full_path.startswith("api/") or full_path.startswith("storage/") or full_path.startswith("assets/"):
            raise HTTPException(status_code=404)
        # Try a literal file (favicon.ico, robots.txt, etc.)
        candidate = os.path.join(_frontend_dir, full_path)
        if full_path and os.path.isfile(candidate):
            return FileResponse(candidate)
        # SPA fallback — let React Router handle the route on the client.
        return FileResponse(os.path.join(_frontend_dir, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
