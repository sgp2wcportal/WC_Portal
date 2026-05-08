from datetime import datetime
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.donation import DonationCreate, DonationResponse
from app.services.donation_service import (
    create_donation,
    get_donation_analytics,
    get_donation_by_id,
    get_donations,
    set_donation_verified,
)
from app.utils.excel_export import rows_to_xlsx
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/donations", tags=["donations"])


class VerifyRequest(BaseModel):
    verified: bool = True


def _require_admin_or_generic(current_user: dict):
    if current_user.get("role") not in ("admin", "generic"):
        raise HTTPException(status_code=403, detail="Admin or generic role required")


@router.post("/", response_model=DonationResponse)
async def create_new_donation(
    donation: DonationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return create_donation(
        db,
        donor_name=donation.donor_name,
        donor_email=donation.donor_email,
        donor_phone=donation.donor_phone,
        tower=donation.tower,
        unit_number=donation.unit_number,
        amount=donation.amount,
        donation_type=donation.donation_type,
        description=donation.description,
        payment_method=donation.payment_method,
        txn_reference=donation.txn_reference,
        payer_upi_id=donation.payer_upi_id,
        created_by=current_user["sub"],
    )


@router.get("/", response_model=list[DonationResponse])
async def list_donations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return get_donations(db, skip, limit)


@router.get("/analytics")
async def donation_analytics(db: Session = Depends(get_db)):
    return get_donation_analytics(db)


@router.get("/export.xlsx")
async def export_donations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    rows = [
        {
            "donor_name": d.donor_name,
            "tower": d.tower or "",
            "unit_number": d.unit_number or "",
            "donation_type": d.donation_type,
            "amount": d.amount,
            "donor_email": d.donor_email,
            "donor_phone": d.donor_phone,
            "description": d.description or "",
            "is_verified": d.is_verified,
            "verified_at": d.verified_at,
            "verified_by": d.verified_by or "",
            "created_at": d.created_at,
        }
        for d in get_donations(db, skip=0, limit=10_000)
    ]
    columns = [
        ("Full Name", "donor_name"),
        ("Tower", "tower"),
        ("Unit", "unit_number"),
        ("Type", "donation_type"),
        ("Amount (INR)", "amount"),
        ("Email", "donor_email"),
        ("Contact Number", "donor_phone"),
        ("Description", "description"),
        ("Verified?", "is_verified"),
        ("Verified At", "verified_at"),
        ("Verified By", "verified_by"),
        ("Recorded On", "created_at"),
    ]
    data = rows_to_xlsx(sheet_title="Donations", columns=columns, rows=rows)
    fname = f"donations_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    return Response(
        content=data,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename*=UTF-8''{quote(fname)}"},
    )


@router.get("/{donation_id}", response_model=DonationResponse)
async def get_donation(donation_id: str, db: Session = Depends(get_db)):
    donation = get_donation_by_id(db, donation_id)
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation


@router.patch("/{donation_id}/verify", response_model=DonationResponse)
async def verify_donation(
    donation_id: str,
    payload: VerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    donation = set_donation_verified(
        db, donation_id, verified=payload.verified, actor=current_user["sub"],
    )
    if not donation:
        raise HTTPException(status_code=404, detail="Donation not found")
    return donation
