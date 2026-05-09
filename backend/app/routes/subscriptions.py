from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from app.services.subscription_service import (
    create_subscription,
    delete_subscription,
    get_subscription_analytics,
    get_subscription_by_id,
    get_subscriptions,
    set_subscription_verified,
)
from app.utils.excel_export import rows_to_xlsx
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])


class VerifyRequest(BaseModel):
    verified: bool = True


def _require_admin_or_generic(current_user: dict):
    if current_user.get("role") not in ("admin", "generic"):
        raise HTTPException(status_code=403, detail="Admin or generic role required")


@router.post("/", response_model=SubscriptionResponse)
async def create_new_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return create_subscription(
        db,
        owner_name=subscription.owner_name,
        contact_number=subscription.contact_number,
        email=subscription.email,
        tower=subscription.tower,
        unit_number=subscription.unit_number,
        subscription_amount=subscription.subscription_amount,
        family_members=subscription.family_members,
        is_rented=subscription.is_rented,
        landlord_name=subscription.landlord_name,
        landlord_contact=subscription.landlord_contact,
        payment_method=subscription.payment_method,
        txn_reference=subscription.txn_reference,
        payer_upi_id=subscription.payer_upi_id,
        created_by=current_user["sub"],
    )


@router.get("/", response_model=list[SubscriptionResponse])
async def list_subscriptions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_subscriptions(db, skip, limit)


@router.get("/analytics")
async def subscription_analytics(db: Session = Depends(get_db)):
    return get_subscription_analytics(db)


@router.get("/export.xlsx")
async def export_subscriptions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    rows = [
        {
            "owner_name": s.owner_name,
            "tower": s.tower or "",
            "unit_number": s.unit_number,
            "subscription_amount": s.subscription_amount,
            "family_members": s.family_members,
            "is_rented": s.is_rented,
            "landlord_name": s.landlord_name or "",
            "landlord_contact": s.landlord_contact or "",
            "contact_number": s.contact_number,
            "email": s.email,
            "is_verified": s.is_verified,
            "verified_at": s.verified_at,
            "verified_by": s.verified_by or "",
            "created_at": s.created_at,
        }
        for s in get_subscriptions(db, skip=0, limit=10_000)
    ]
    columns = [
        ("Full Name", "owner_name"),
        ("Tower", "tower"),
        ("Unit", "unit_number"),
        ("Amount (INR)", "subscription_amount"),
        ("Family Members", "family_members"),
        ("Rented?", "is_rented"),
        ("Owner Name", "landlord_name"),
        ("Owner Contact", "landlord_contact"),
        ("Contact Number", "contact_number"),
        ("Email", "email"),
        ("Verified?", "is_verified"),
        ("Verified At", "verified_at"),
        ("Verified By", "verified_by"),
        ("Subscribed On", "created_at"),
    ]
    data = rows_to_xlsx(sheet_title="Subscriptions", columns=columns, rows=rows)
    fname = f"subscriptions_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(fname)}"},
    )


@router.get("/{subscription_id}", response_model=SubscriptionResponse)
async def get_subscription(subscription_id: str, db: Session = Depends(get_db)):
    subscription = get_subscription_by_id(db, subscription_id)
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription


@router.delete("/{subscription_id}")
async def delete_subscription_record(
    subscription_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    if not delete_subscription(db, subscription_id):
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Deleted"}


@router.patch("/{subscription_id}/verify", response_model=SubscriptionResponse)
async def verify_subscription(
    subscription_id: str,
    payload: VerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    subscription = set_subscription_verified(
        db, subscription_id, verified=payload.verified, actor=current_user["sub"],
    )
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return subscription
