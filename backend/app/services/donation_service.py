from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.donation import Donation
import uuid


def create_donation(
    db: Session,
    *,
    donor_name: str,
    donor_email: str,
    donor_phone: str,
    tower: str,
    unit_number: str,
    amount: float,
    donation_type: str,
    description: str,
    created_by: str,
    payment_method: str = "upi",
    txn_reference: str | None = None,
    payer_upi_id: str | None = None,
) -> Donation:
    method = (payment_method or "upi").strip().lower()
    if method not in ("upi", "cash"):
        method = "upi"
    txn = (txn_reference or "").strip() or None
    vpa = (payer_upi_id or "").strip() or None
    if method == "cash":
        txn = None
        vpa = None

    donation = Donation(
        id=str(uuid.uuid4()),
        donor_name=donor_name,
        donor_email=donor_email,
        donor_phone=donor_phone,
        tower=tower,
        unit_number=unit_number,
        amount=amount,
        donation_type=donation_type,
        description=description,
        payment_method=method,
        txn_reference=txn,
        payer_upi_id=vpa,
        created_by=created_by,
    )
    db.add(donation)
    db.commit()
    db.refresh(donation)
    return donation


def get_donations(db: Session, skip: int = 0, limit: int = 1000):
    return (
        db.query(Donation)
        .order_by(Donation.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_donation_by_id(db: Session, donation_id: str):
    return db.query(Donation).filter(Donation.id == donation_id).first()


def set_donation_verified(db: Session, donation_id: str, *, verified: bool, actor: str):
    donation = get_donation_by_id(db, donation_id)
    if not donation:
        return None
    donation.is_verified = bool(verified)
    if verified:
        donation.verified_at = datetime.now(timezone.utc)
        donation.verified_by = actor
    else:
        donation.verified_at = None
        donation.verified_by = None
    db.commit()
    db.refresh(donation)
    return donation


def get_donation_analytics(db: Session):
    """Get donation analytics for dashboard"""
    from sqlalchemy import func

    total_donations = db.query(func.sum(Donation.amount)).scalar() or 0

    by_type = (
        db.query(
            Donation.donation_type,
            func.sum(Donation.amount).label('total'),
            func.count(Donation.id).label('count'),
        )
        .group_by(Donation.donation_type)
        .all()
    )

    return {
        "total": total_donations,
        "by_type": [{"type": dtype, "amount": amt, "count": cnt} for dtype, amt, cnt in by_type],
    }
