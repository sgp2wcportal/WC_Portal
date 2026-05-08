from fastapi import APIRouter, Response
from pydantic import BaseModel

from app.config import settings
from app.utils.qrcode_generator import build_upi_uri, generate_qrcode

router = APIRouter(prefix="/api/payments", tags=["payments"])


class UpiInfoResponse(BaseModel):
    upi_id: str
    upi_name: str
    upi_uri: str


@router.get("/upi-info", response_model=UpiInfoResponse)
async def upi_info(amount: float | None = None, note: str | None = None):
    """Returns the committee UPI VPA + a `upi://` URI that wallets can open.

    Generic counterpart to the coupon-specific endpoint — used by subscriptions,
    donations, and anywhere else a payment QR is shown.
    """
    uri = build_upi_uri(
        settings.COMMITTEE_UPI_ID,
        settings.COMMITTEE_UPI_NAME,
        amount=amount,
        note=note,
    )
    return UpiInfoResponse(
        upi_id=settings.COMMITTEE_UPI_ID,
        upi_name=settings.COMMITTEE_UPI_NAME,
        upi_uri=uri,
    )


@router.get("/upi-qr")
async def upi_qr(amount: float, note: str | None = None):
    """Return a PNG QR code that opens the committee UPI VPA for the given amount."""
    uri = build_upi_uri(
        settings.COMMITTEE_UPI_ID,
        settings.COMMITTEE_UPI_NAME,
        amount=amount,
        note=note,
    )
    safe = (note or "payment").replace(" ", "_")
    path = generate_qrcode(uri, folder="../storage/payment_qrs", filename=f"upi_{safe}_{amount:.2f}.png")
    with open(path, "rb") as f:
        return Response(content=f.read(), media_type="image/png")
