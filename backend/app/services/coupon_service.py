from __future__ import annotations

import logging
import os
import uuid
from datetime import datetime, timezone
from html import escape

from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.config import settings
from app.models.coupon import Coupon, CouponMenu, CouponOccasionOption, CouponTicket
from app.models.subscription import Subscription
from app.utils.qrcode_generator import generate_qrcode

log = logging.getLogger(__name__)


# ---------- Custom errors ----------

class SubscriptionNotVerified(Exception):
    """Booking blocked because the resident has no verified subscription on record."""


class DuplicateOccasion(Exception):
    pass


class OccasionInUse(Exception):
    pass


# ---------- Menus ----------

def create_coupon_menu(
    db: Session,
    *,
    event_name: str,
    veg_price: float,
    nonveg_price: float,
    veg_menu: str,
    nonveg_menu: str,
    created_by: str,
    event_date: datetime | None = None,
    occasion: str | None = None,
    veg_kid_price: float | None = None,
    nonveg_kid_price: float | None = None,
) -> CouponMenu:
    menu = CouponMenu(
        id=str(uuid.uuid4()),
        event_name=event_name,
        event_date=event_date,
        occasion=occasion,
        veg_price=veg_price,
        nonveg_price=nonveg_price,
        veg_kid_price=veg_kid_price,
        nonveg_kid_price=nonveg_kid_price,
        veg_menu=veg_menu,
        nonveg_menu=nonveg_menu,
        created_by=created_by,
    )
    db.add(menu)
    db.commit()
    db.refresh(menu)
    return menu


def get_coupon_menus(db: Session, include_inactive: bool = False):
    q = db.query(CouponMenu)
    if not include_inactive:
        q = q.filter(CouponMenu.is_active == True)
    return q.order_by(CouponMenu.created_at.desc()).all()


def get_coupon_menu_by_id(db: Session, menu_id: str):
    return db.query(CouponMenu).filter(CouponMenu.id == menu_id).first()


def get_coupon_menu_by_event(db: Session, event_name: str):
    return db.query(CouponMenu).filter(CouponMenu.event_name == event_name).first()


def update_coupon_menu(db: Session, menu_id: str, **fields) -> CouponMenu | None:
    menu = get_coupon_menu_by_id(db, menu_id)
    if not menu:
        return None
    for key, value in fields.items():
        if value is not None and hasattr(menu, key):
            setattr(menu, key, value)
    db.commit()
    db.refresh(menu)
    return menu


def delete_coupon_menu(db: Session, menu_id: str) -> bool:
    menu = get_coupon_menu_by_id(db, menu_id)
    if not menu:
        return False
    menu.is_active = False
    db.commit()
    return True


def set_menu_image(db: Session, menu_id: str, image_path: str, image_type: str) -> CouponMenu | None:
    menu = get_coupon_menu_by_id(db, menu_id)
    if not menu:
        return None
    if image_type == "veg":
        menu.veg_image = image_path
    elif image_type == "nonveg":
        menu.nonveg_image = image_path
    else:
        raise ValueError("image_type must be 'veg' or 'nonveg'")
    db.commit()
    db.refresh(menu)
    return menu


# ---------- Bookings & tickets ----------

def _booking_qr_dir() -> str:
    return os.path.join("..", "storage", "qrcodes")


def create_coupon(
    db: Session,
    *,
    tower: str,
    unit_number: str,
    contact_number: str,
    email: str,
    event_name: str,
    pax: int,
    veg_count: int,
    nonveg_count: int,
    created_by: str,
    veg_kid_count: int = 0,
    nonveg_kid_count: int = 0,
    payment_method: str = "upi",
    txn_reference: str | None = None,
    payer_upi_id: str | None = None,
) -> Coupon:
    expected_pax = veg_count + nonveg_count + veg_kid_count + nonveg_kid_count
    if pax != expected_pax:
        raise ValueError(
            f"pax ({pax}) must equal veg + non-veg adult + veg kid + non-veg kid "
            f"({veg_count} + {nonveg_count} + {veg_kid_count} + {nonveg_kid_count} = {expected_pax})"
        )
    if pax <= 0:
        raise ValueError("Booking must include at least one ticket")

    tower = (tower or "").strip()
    unit_number = (unit_number or "").strip()
    contact_number = (contact_number or "").strip()
    if not tower or not unit_number:
        raise ValueError("Tower and Unit Number are required")
    if not contact_number:
        raise ValueError("Contact Number is required")

    payment_method = (payment_method or "upi").strip().lower()
    if payment_method not in ("upi", "cash"):
        raise ValueError("Invalid payment method")

    txn_reference = (txn_reference or "").strip() or None
    payer_upi_id = (payer_upi_id or "").strip() or None
    # Cash payments never carry a txn reference / VPA
    if payment_method == "cash":
        txn_reference = None
        payer_upi_id = None

    # Gate: this flat must have a verified subscription on record.
    sub = (
        db.query(Subscription)
        .filter(
            Subscription.tower == tower,
            Subscription.unit_number == unit_number,
            Subscription.is_verified == True,  # noqa: E712 (SQLAlchemy boolean comparison)
        )
        .first()
    )
    if not sub:
        raise SubscriptionNotVerified(
            "You need to pay the Annual Subscription first in order to avail Food Coupons."
        )

    menu = get_coupon_menu_by_event(db, event_name)
    if not menu:
        raise ValueError(f"Event menu not found for '{event_name}'")
    if not menu.is_active:
        raise ValueError(f"Event '{event_name}' is no longer accepting bookings")

    if (veg_kid_count > 0 and (menu.veg_kid_price is None)) or (
        nonveg_kid_count > 0 and (menu.nonveg_kid_price is None)
    ):
        raise ValueError(
            "This event doesn't have a Kid price configured. Ask the admin to add one or use adult counts."
        )

    veg_kid_price = menu.veg_kid_price or 0
    nonveg_kid_price = menu.nonveg_kid_price or 0
    total_amount = (
        (veg_count * menu.veg_price)
        + (nonveg_count * menu.nonveg_price)
        + (veg_kid_count * veg_kid_price)
        + (nonveg_kid_count * nonveg_kid_price)
    )
    booking_id = str(uuid.uuid4())
    flat_number = f"{tower}-{unit_number}"

    booking = Coupon(
        id=booking_id,
        flat_number=flat_number,
        tower=tower,
        unit_number=unit_number,
        contact_number=contact_number,
        email=email,
        event_name=event_name,
        pax=pax,
        veg_count=veg_count,
        nonveg_count=nonveg_count,
        veg_kid_count=veg_kid_count,
        nonveg_kid_count=nonveg_kid_count,
        payment_method=payment_method,
        total_amount=total_amount,
        txn_reference=txn_reference,
        payer_upi_id=payer_upi_id,
        created_by=created_by,
    )
    db.add(booking)
    db.flush()

    qr_dir = _booking_qr_dir()
    tickets: list[CouponTicket] = []
    # One ticket per pax. ticket_type stays 'veg' / 'nonveg'; the is_kid flag
    # carries the adult/kid distinction so it surfaces on the printed tickets.
    ticket_plan = (
        ("veg",    veg_count,        False),
        ("nonveg", nonveg_count,     False),
        ("veg",    veg_kid_count,    True),
        ("nonveg", nonveg_kid_count, True),
    )
    for ticket_type, count, is_kid in ticket_plan:
        for _ in range(count):
            ticket_id = str(uuid.uuid4())
            qr_path = generate_qrcode(
                f"TICKET:{ticket_id}",
                folder=qr_dir,
                filename=f"ticket_{ticket_id}.png",
            )
            tickets.append(
                CouponTicket(
                    id=ticket_id,
                    booking_id=booking_id,
                    event_name=event_name,
                    ticket_type=ticket_type,
                    is_kid=is_kid,
                    qr_code_path=qr_path,
                )
            )
    db.add_all(tickets)
    db.commit()
    db.refresh(booking)
    return booking


def email_booking_confirmation(booking: Coupon, menu: CouponMenu | None) -> dict:
    """Render and send the booking confirmation email. Returns delivery metadata."""
    subject = f"Your food coupons for {booking.event_name}"
    rows = "".join(
        f"""
        <tr>
          <td style="padding:8px;border:1px solid #e5e7eb;font-family:monospace">{escape(t.id)}</td>
          <td style="padding:8px;border:1px solid #e5e7eb">{'Veg' if t.ticket_type == 'veg' else 'Non-Veg'}</td>
          <td style="padding:8px;border:1px solid #e5e7eb"><img src="cid:{escape(t.id)}" alt="QR" style="width:140px;height:140px"/></td>
        </tr>
        """
        for t in booking.tickets
    )
    parts = []
    if booking.veg_count:
        parts.append(f"{booking.veg_count} veg adult × ₹{(menu.veg_price if menu else 0):.2f}")
    if booking.nonveg_count:
        parts.append(f"{booking.nonveg_count} non-veg adult × ₹{(menu.nonveg_price if menu else 0):.2f}")
    if booking.veg_kid_count:
        kid_p = (menu.veg_kid_price if (menu and menu.veg_kid_price is not None) else 0)
        parts.append(f"{booking.veg_kid_count} veg kid × ₹{kid_p:.2f}")
    if booking.nonveg_kid_count:
        kid_p = (menu.nonveg_kid_price if (menu and menu.nonveg_kid_price is not None) else 0)
        parts.append(f"{booking.nonveg_kid_count} non-veg kid × ₹{kid_p:.2f}")
    breakdown = " + ".join(parts)

    html = f"""
    <div style="font-family:system-ui,Segoe UI,Arial,sans-serif;max-width:680px;margin:auto;color:#111827">
      <h2 style="color:#1d4ed8">Your food coupons are confirmed</h2>
      <p>Hi resident of flat <b>{escape(booking.flat_number)}</b>,</p>
      <p>Your booking for <b>{escape(booking.event_name)}</b> is confirmed.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:6px 12px;color:#6b7280">Pax</td><td style="padding:6px 12px"><b>{booking.pax}</b></td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Breakdown</td><td style="padding:6px 12px">{escape(breakdown)}</td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Total paid</td><td style="padding:6px 12px"><b>₹{booking.total_amount:.2f}</b></td></tr>
        <tr><td style="padding:6px 12px;color:#6b7280">Payment method</td><td style="padding:6px 12px">{'UPI' if (booking.payment_method or 'upi').lower() == 'upi' else 'Cash'}</td></tr>
        {f'<tr><td style="padding:6px 12px;color:#6b7280">UPI txn reference</td><td style="padding:6px 12px;font-family:monospace">{escape(booking.txn_reference)}</td></tr>' if booking.txn_reference else ''}
        {f'<tr><td style="padding:6px 12px;color:#6b7280">Payer UPI ID</td><td style="padding:6px 12px;font-family:monospace">{escape(booking.payer_upi_id)}</td></tr>' if booking.payer_upi_id else ''}
      </table>
      <p style="color:#6b7280;font-size:13px">{'Please keep your UPI transaction reference handy — the committee uses it to reconcile your payment with the bank statement.' if (booking.payment_method or 'upi').lower() == 'upi' else 'Please pay the committee in cash before the event — your record will be marked verified once received.'}</p>
      <p>Please show the QR code for each meal at the dining area. Each QR is valid for one meal only.</p>
      <table style="border-collapse:collapse;width:100%;margin-top:8px">
        <thead>
          <tr style="background:#f3f4f6">
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Ticket ID</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">Type</th>
            <th style="padding:8px;border:1px solid #e5e7eb;text-align:left">QR</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
      <p style="color:#6b7280;font-size:12px;margin-top:24px">Siddha Galaxia Phase 2 Welfare Committee</p>
    </div>
    """

    # Attach each QR with a Content-ID so the inline <img cid:...> tags render.
    from email.message import EmailMessage
    msg = EmailMessage()
    msg["From"] = settings.SMTP_FROM or settings.SMTP_USER or "no-reply@society.local"
    msg["To"] = booking.email
    msg["Subject"] = subject
    msg.set_content("Your email client does not support HTML. Open in a browser.")
    msg.add_alternative(html, subtype="html")
    html_part = msg.get_payload()[-1]
    for t in booking.tickets:
        if t.qr_code_path and os.path.exists(t.qr_code_path):
            with open(t.qr_code_path, "rb") as f:
                html_part.add_related(
                    f.read(),
                    maintype="image",
                    subtype="png",
                    cid=f"<{t.id}>",
                    filename=f"ticket-{t.id}.png",
                )

    if settings.SMTP_HOST:
        try:
            import smtplib
            if settings.SMTP_TLS:
                smtp = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
                smtp.starttls()
            else:
                smtp = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15)
            with smtp:
                if settings.SMTP_USER:
                    smtp.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                smtp.send_message(msg)
            return {"delivery": "smtp", "to": booking.email}
        except Exception as exc:
            log.exception("SMTP delivery failed, falling back to disk: %s", exc)

    # Fallback: write to ../storage/emails/<booking-id>/
    from pathlib import Path
    folder = Path("../storage/emails") / booking.id
    folder.mkdir(parents=True, exist_ok=True)
    (folder / "message.eml").write_bytes(bytes(msg))
    (folder / "preview.html").write_text(html, encoding="utf-8")
    return {"delivery": "file", "to": booking.email, "path": str(folder)}


def get_coupon_by_id(db: Session, coupon_id: str):
    return db.query(Coupon).filter(Coupon.id == coupon_id).first()


def get_ticket_by_id(db: Session, ticket_id: str):
    return db.query(CouponTicket).filter(CouponTicket.id == ticket_id).first()


class TicketAlreadyUsed(Exception):
    def __init__(self, ticket: "CouponTicket"):
        self.ticket = ticket
        super().__init__("Ticket already used")


def verify_ticket(db: Session, code: str, used_by: str) -> CouponTicket | None:
    ticket_id = code.split("TICKET:", 1)[-1].strip()
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        return None
    if ticket.is_used:
        raise TicketAlreadyUsed(ticket)
    ticket.is_used = True
    ticket.used_at = datetime.now(timezone.utc)
    ticket.used_by = used_by
    # Mark the booking as fully verified once every ticket is used.
    booking = db.query(Coupon).filter(Coupon.id == ticket.booking_id).first()
    if booking and all(t.is_used or t.id == ticket.id for t in booking.tickets):
        booking.is_verified = True
        booking.verified_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


def get_coupons_by_event(db: Session, event_name: str):
    return (
        db.query(Coupon)
        .filter(Coupon.event_name == event_name)
        .order_by(Coupon.created_at.desc())
        .all()
    )


def get_user_coupons(db: Session, email: str):
    return (
        db.query(Coupon)
        .filter(Coupon.email == email)
        .order_by(Coupon.created_at.desc())
        .all()
    )


def get_event_dashboard(db: Session, event_name: str) -> dict:
    """Return aggregate totals + the bookings list for an event."""
    bookings = get_coupons_by_event(db, event_name)
    veg_total = sum(b.veg_count for b in bookings)
    nonveg_total = sum(b.nonveg_count for b in bookings)
    veg_kid_total = sum(b.veg_kid_count or 0 for b in bookings)
    nonveg_kid_total = sum(b.nonveg_kid_count or 0 for b in bookings)
    veg_used = nonveg_used = veg_kid_used = nonveg_kid_used = 0
    for b in bookings:
        for t in b.tickets:
            if t.is_used:
                is_kid = getattr(t, "is_kid", False)
                if t.ticket_type == "veg":
                    if is_kid:
                        veg_kid_used += 1
                    else:
                        veg_used += 1
                else:
                    if is_kid:
                        nonveg_kid_used += 1
                    else:
                        nonveg_used += 1
    return {
        "event_name": event_name,
        "totals": {
            "bookings": len(bookings),
            "pax": sum(b.pax for b in bookings),
            "veg": veg_total,
            "nonveg": nonveg_total,
            "veg_kid": veg_kid_total,
            "nonveg_kid": nonveg_kid_total,
            "veg_used": veg_used,
            "nonveg_used": nonveg_used,
            "veg_kid_used": veg_kid_used,
            "nonveg_kid_used": nonveg_kid_used,
            "veg_remaining": veg_total - veg_used,
            "nonveg_remaining": nonveg_total - nonveg_used,
            "veg_kid_remaining": veg_kid_total - veg_kid_used,
            "nonveg_kid_remaining": nonveg_kid_total - nonveg_kid_used,
            "total_amount": sum(b.total_amount for b in bookings),
        },
        "bookings": bookings,
    }


def update_coupon(
    db: Session,
    booking_id: str,
    *,
    flat_number: str | None = None,
    tower: str | None = None,
    unit_number: str | None = None,
    contact_number: str | None = None,
    email: str | None = None,
    pax: int | None = None,
    veg_count: int | None = None,
    nonveg_count: int | None = None,
    veg_kid_count: int | None = None,
    nonveg_kid_count: int | None = None,
    payment_method: str | None = None,
    txn_reference: str | None = None,
    payer_upi_id: str | None = None,
    payment_verified: bool | None = None,
    actor: str | None = None,
) -> Coupon | None:
    """Edit a booking. Adjusts ticket rows (and QRs) if counts change.

    Refuses to reduce a count below the number of *used* tickets of that type.
    """
    booking = get_coupon_by_id(db, booking_id)
    if not booking:
        return None

    new_veg = booking.veg_count if veg_count is None else veg_count
    new_nonveg = booking.nonveg_count if nonveg_count is None else nonveg_count
    new_veg_kid = booking.veg_kid_count if veg_kid_count is None else veg_kid_count
    new_nonveg_kid = booking.nonveg_kid_count if nonveg_kid_count is None else nonveg_kid_count
    expected = new_veg + new_nonveg + new_veg_kid + new_nonveg_kid
    new_pax = pax if pax is not None else expected
    if new_pax != expected:
        raise ValueError(
            f"pax ({new_pax}) must equal adult+kid totals "
            f"({new_veg} + {new_nonveg} + {new_veg_kid} + {new_nonveg_kid} = {expected})"
        )
    if new_pax <= 0:
        raise ValueError("Booking must have at least one ticket")

    if flat_number is not None:
        booking.flat_number = flat_number
    if tower is not None:
        booking.tower = tower or None
    if unit_number is not None:
        booking.unit_number = unit_number or None
    if contact_number is not None:
        booking.contact_number = contact_number or None
    # If tower or unit changed, refresh the derived flat_number for backward compat
    if (tower is not None or unit_number is not None) and booking.tower and booking.unit_number:
        booking.flat_number = f"{booking.tower}-{booking.unit_number}"
    if email is not None:
        booking.email = email
    if payment_method is not None:
        method = payment_method.strip().lower()
        if method not in ("upi", "cash"):
            raise ValueError("Invalid payment method")
        booking.payment_method = method
        if method == "cash":
            # Cash bookings can't have UPI metadata
            booking.txn_reference = None
            booking.payer_upi_id = None
    if txn_reference is not None:
        cleaned = txn_reference.strip()
        booking.txn_reference = cleaned or None
    if payer_upi_id is not None:
        cleaned_vpa = payer_upi_id.strip()
        booking.payer_upi_id = cleaned_vpa or None
    if payment_verified is not None:
        booking.payment_verified = bool(payment_verified)
        if payment_verified:
            booking.payment_verified_at = datetime.now(timezone.utc)
            booking.payment_verified_by = actor
        else:
            booking.payment_verified_at = None
            booking.payment_verified_by = None

    counts_changed = (
        new_veg != booking.veg_count
        or new_nonveg != booking.nonveg_count
        or new_veg_kid != booking.veg_kid_count
        or new_nonveg_kid != booking.nonveg_kid_count
    )
    if counts_changed:
        menu = get_coupon_menu_by_event(db, booking.event_name)
        if not menu:
            raise ValueError("Event menu missing — cannot recompute total")
        if (new_veg_kid > 0 and menu.veg_kid_price is None) or (
            new_nonveg_kid > 0 and menu.nonveg_kid_price is None
        ):
            raise ValueError(
                "This event doesn't have a Kid price configured. Update the event first."
            )
        _resize_tickets(db, booking, "veg",    new_veg,        is_kid=False)
        _resize_tickets(db, booking, "veg",    new_veg_kid,    is_kid=True)
        _resize_tickets(db, booking, "nonveg", new_nonveg,     is_kid=False)
        _resize_tickets(db, booking, "nonveg", new_nonveg_kid, is_kid=True)
        booking.veg_count = new_veg
        booking.nonveg_count = new_nonveg
        booking.veg_kid_count = new_veg_kid
        booking.nonveg_kid_count = new_nonveg_kid
        booking.total_amount = (
            new_veg * menu.veg_price
            + new_nonveg * menu.nonveg_price
            + new_veg_kid * (menu.veg_kid_price or 0)
            + new_nonveg_kid * (menu.nonveg_kid_price or 0)
        )

    booking.pax = new_pax
    db.commit()
    db.refresh(booking)
    return booking


def _resize_tickets(db: Session, booking: Coupon, ticket_type: str, target: int, *, is_kid: bool = False) -> None:
    existing = [t for t in booking.tickets if t.ticket_type == ticket_type and bool(t.is_kid) == is_kid]
    label = f"{'kid ' if is_kid else ''}{ticket_type}"
    if target < 0:
        raise ValueError(f"{label}_count cannot be negative")
    if target == len(existing):
        return
    if target > len(existing):
        for _ in range(target - len(existing)):
            ticket_id = str(uuid.uuid4())
            qr_path = generate_qrcode(
                f"TICKET:{ticket_id}",
                folder=os.path.join("..", "storage", "qrcodes"),
                filename=f"ticket_{ticket_id}.png",
            )
            db.add(
                CouponTicket(
                    id=ticket_id,
                    booking_id=booking.id,
                    event_name=booking.event_name,
                    ticket_type=ticket_type,
                    is_kid=is_kid,
                    qr_code_path=qr_path,
                )
            )
    else:
        # Reduction: remove unused tickets only.
        unused = [t for t in existing if not t.is_used]
        used_count = len(existing) - len(unused)
        if target < used_count:
            raise ValueError(
                f"Cannot reduce {label} to {target}: {used_count} are already used"
            )
        to_remove = len(existing) - target
        for t in unused[:to_remove]:
            if t.qr_code_path and os.path.exists(t.qr_code_path):
                try:
                    os.remove(t.qr_code_path)
                except OSError:
                    pass
            db.delete(t)


# ---------- Occasion lookup (admin-managed) ----------

def list_coupon_occasions(db: Session):
    return db.query(CouponOccasionOption).order_by(CouponOccasionOption.name).all()


def add_coupon_occasion(db: Session, *, name: str, created_by: str | None) -> CouponOccasionOption:
    option = CouponOccasionOption(id=str(uuid.uuid4()), name=name.strip(), created_by=created_by)
    db.add(option)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise DuplicateOccasion(name)
    db.refresh(option)
    return option


def delete_coupon_occasion(db: Session, option_id: str) -> bool:
    option = db.query(CouponOccasionOption).filter(CouponOccasionOption.id == option_id).first()
    if not option:
        return False
    in_use = db.query(CouponMenu).filter(CouponMenu.occasion == option.name).first()
    if in_use:
        raise OccasionInUse(option.name)
    db.delete(option)
    db.commit()
    return True


def rename_coupon_occasion(db: Session, option_id: str, *, new_name: str) -> CouponOccasionOption | None:
    """Rename an occasion and cascade the change to every event tagged with the old name."""
    option = db.query(CouponOccasionOption).filter(CouponOccasionOption.id == option_id).first()
    if not option:
        return None
    cleaned = (new_name or "").strip()
    if not cleaned:
        raise ValueError("Occasion name cannot be blank")
    if cleaned == option.name:
        return option
    old_name = option.name
    option.name = cleaned
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise DuplicateOccasion(cleaned)
    # Cascade: update every CouponMenu currently tagged with the old name
    db.query(CouponMenu).filter(CouponMenu.occasion == old_name).update(
        {CouponMenu.occasion: cleaned}, synchronize_session=False,
    )
    db.commit()
    db.refresh(option)
    return option


def seed_default_coupon_occasions(db: Session) -> None:
    """Idempotent seed — fills the coupon_occasions table on first boot."""
    if db.query(CouponOccasionOption).first() is not None:
        return
    defaults = [
        "Durga Puja", "Ganesh Chaturthi", "Diwali", "Holi", "Annual Day", "Other",
    ]
    for name in defaults:
        db.add(CouponOccasionOption(id=str(uuid.uuid4()), name=name))
    db.commit()
