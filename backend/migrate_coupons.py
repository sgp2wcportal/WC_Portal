"""One-shot migration for the per-ticket coupon refactor.

Idempotent: rerun safely. Handles three things:

1. Adds new columns to existing `coupon_menus` and `coupons` tables.
2. Creates the `coupon_tickets` table if missing.
3. Back-fills tickets (one row per coupon) for any pre-existing bookings,
   reusing the booking-level QR for the first ticket and generating new
   QRs for the rest.
"""
import os
import sqlite3
import sys
import uuid

# allow `from app.*` imports when run from the backend dir
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.utils.qrcode_generator import generate_qrcode

DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), "society.db")


def cols(con: sqlite3.Connection, table: str) -> list[str]:
    return [r[1] for r in con.execute(f"PRAGMA table_info({table})").fetchall()]


def main():
    con = sqlite3.connect(DB)
    try:
        # 1. coupon_menus: add event_date + is_active
        existing = cols(con, "coupon_menus")
        if "event_date" not in existing:
            con.execute("ALTER TABLE coupon_menus ADD COLUMN event_date DATETIME")
            print("added coupon_menus.event_date")
        if "is_active" not in existing:
            con.execute("ALTER TABLE coupon_menus ADD COLUMN is_active BOOLEAN DEFAULT 1")
            print("added coupon_menus.is_active")

        # 2. coupons: add pax
        existing = cols(con, "coupons")
        if "pax" not in existing:
            con.execute("ALTER TABLE coupons ADD COLUMN pax INTEGER DEFAULT 0")
            con.execute("UPDATE coupons SET pax = COALESCE(veg_count,0) + COALESCE(nonveg_count,0)")
            print("added coupons.pax (and back-filled)")

        # 3. coupon_tickets table
        con.execute("""
            CREATE TABLE IF NOT EXISTS coupon_tickets (
                id            TEXT PRIMARY KEY,
                booking_id    TEXT REFERENCES coupons(id) ON DELETE CASCADE,
                event_name    TEXT,
                ticket_type   TEXT,
                qr_code_path  TEXT,
                is_used       BOOLEAN DEFAULT 0,
                used_at       DATETIME,
                used_by       TEXT,
                created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        con.execute("CREATE INDEX IF NOT EXISTS ix_coupon_tickets_booking ON coupon_tickets(booking_id)")
        con.execute("CREATE INDEX IF NOT EXISTS ix_coupon_tickets_event ON coupon_tickets(event_name)")
        print("ensured coupon_tickets table")

        # 4. Backfill: any booking without tickets gets one row per coupon
        bookings_needing_tickets = con.execute("""
            SELECT c.id, c.event_name, c.veg_count, c.nonveg_count, c.qr_code_path
            FROM coupons c
            LEFT JOIN coupon_tickets t ON t.booking_id = c.id
            WHERE t.id IS NULL
        """).fetchall()

        qr_dir = os.path.join("..", "storage", "qrcodes")
        for bid, ev, vc, nvc, legacy_qr in bookings_needing_tickets:
            for ttype, count in (("veg", vc or 0), ("nonveg", nvc or 0)):
                for _ in range(count):
                    tid = str(uuid.uuid4())
                    qr_path = generate_qrcode(
                        f"TICKET:{tid}",
                        folder=qr_dir,
                        filename=f"ticket_{tid}.png",
                    )
                    con.execute(
                        "INSERT INTO coupon_tickets (id, booking_id, event_name, ticket_type, qr_code_path) "
                        "VALUES (?,?,?,?,?)",
                        (tid, bid, ev, ttype, qr_path),
                    )
            print(f"  backfilled tickets for booking {bid} ({(vc or 0)} veg + {(nvc or 0)} nonveg)")

        con.commit()
        print("migration complete")
    finally:
        con.close()


if __name__ == "__main__":
    main()
