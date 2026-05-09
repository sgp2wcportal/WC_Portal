from datetime import datetime, timezone

from sqlalchemy.orm import Session

from app.models.subscription import Subscription
import uuid


def delete_subscription(db: Session, subscription_id: str) -> bool:
    sub = get_subscription_by_id(db, subscription_id)
    if not sub:
        return False
    db.delete(sub)
    db.commit()
    return True


def create_subscription(
    db: Session,
    *,
    owner_name: str,
    contact_number: str,
    email: str,
    tower: str,
    unit_number: str,
    subscription_amount: float,
    family_members: int,
    is_rented: bool,
    landlord_name: str | None,
    landlord_contact: str | None,
    created_by: str,
    payment_method: str = "upi",
    txn_reference: str | None = None,
    payer_upi_id: str | None = None,
) -> Subscription:
    method = (payment_method or "upi").strip().lower()
    if method not in ("upi", "cash"):
        method = "upi"
    txn = (txn_reference or "").strip() or None
    vpa = (payer_upi_id or "").strip() or None
    if method == "cash":
        txn = None
        vpa = None

    subscription = Subscription(
        id=str(uuid.uuid4()),
        owner_name=owner_name,
        contact_number=contact_number,
        email=email,
        tower=tower,
        unit_number=unit_number,
        subscription_amount=subscription_amount,
        family_members=family_members,
        is_rented=is_rented,
        landlord_name=landlord_name if is_rented else None,
        landlord_contact=landlord_contact if is_rented else None,
        payment_method=method,
        txn_reference=txn,
        payer_upi_id=vpa,
        created_by=created_by,
    )
    db.add(subscription)
    db.commit()
    db.refresh(subscription)
    return subscription


def get_subscriptions(db: Session, skip: int = 0, limit: int = 1000):
    return (
        db.query(Subscription)
        .order_by(Subscription.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_subscription_by_id(db: Session, subscription_id: str):
    return db.query(Subscription).filter(Subscription.id == subscription_id).first()


def get_subscription_by_unit(db: Session, unit_number: str):
    return db.query(Subscription).filter(Subscription.unit_number == unit_number).first()


def update_subscription(db: Session, subscription_id: str, **kwargs):
    subscription = get_subscription_by_id(db, subscription_id)
    if not subscription:
        return None
    for key, value in kwargs.items():
        if value is not None and hasattr(subscription, key):
            setattr(subscription, key, value)
    db.commit()
    db.refresh(subscription)
    return subscription


def set_subscription_verified(db: Session, subscription_id: str, *, verified: bool, actor: str):
    subscription = get_subscription_by_id(db, subscription_id)
    if not subscription:
        return None
    subscription.is_verified = bool(verified)
    if verified:
        subscription.verified_at = datetime.now(timezone.utc)
        subscription.verified_by = actor
    else:
        subscription.verified_at = None
        subscription.verified_by = None
    db.commit()
    db.refresh(subscription)
    return subscription


def get_subscription_analytics(db: Session):
    """Get subscription analytics for dashboard"""
    from sqlalchemy import func

    total_subscriptions = db.query(func.count(Subscription.id)).scalar() or 0
    total_amount = db.query(func.sum(Subscription.subscription_amount)).scalar() or 0

    return {
        "total_subscriptions": total_subscriptions,
        "total_amount": total_amount,
        "average_amount": total_amount / total_subscriptions if total_subscriptions > 0 else 0,
    }
