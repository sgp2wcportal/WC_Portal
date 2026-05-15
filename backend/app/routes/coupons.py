from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.schemas.coupon import (
    CouponCreate,
    CouponMenuCreate,
    CouponMenuResponse,
    CouponMenuUpdate,
    CouponResponse,
    CouponTicketResponse,
    CouponUpdate,
    EventDashboardResponse,
    OccasionOptionCreate,
    OccasionOptionResponse,
    PaymentInfoResponse,
    TicketVerifyRequest,
)
from app.services.coupon_service import (
    DuplicateOccasion,
    OccasionInUse,
    PaymentNotVerified,
    SubscriptionNotVerified,
    TicketAlreadyUsed,
    add_coupon_occasion,
    create_coupon,
    create_coupon_menu,
    delete_coupon_menu,
    delete_coupon_occasion,
    email_booking_confirmation,
    get_coupon_by_id,
    get_coupon_menu_by_event,
    get_coupon_menu_by_id,
    get_coupon_menus,
    get_coupons_by_event,
    get_event_dashboard,
    get_ticket_by_id,
    get_user_coupons,
    list_coupon_occasions,
    rename_coupon_occasion,
    set_menu_image,
    update_coupon,
    update_coupon_menu,
    verify_ticket,
)
from app.models.coupon import Coupon
from app.utils.file_handler import save_upload_file
from app.utils.jwt_handler import get_current_user
from app.utils.qrcode_generator import build_upi_uri, generate_qrcode

router = APIRouter(prefix="/api/coupons", tags=["coupons"])


def _require_admin_or_generic(current_user: dict):
    if current_user.get("role") not in ("admin", "generic"):
        raise HTTPException(status_code=403, detail="Admin or generic role required")


# ---------- Menus ----------

@router.post("/menus/", response_model=CouponMenuResponse)
async def create_menu(
    menu: CouponMenuCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    if get_coupon_menu_by_event(db, menu.event_name):
        raise HTTPException(status_code=409, detail=f"Menu '{menu.event_name}' already exists")
    return create_coupon_menu(
        db,
        event_name=menu.event_name,
        event_date=menu.event_date,
        occasion=menu.occasion,
        veg_price=menu.veg_price,
        nonveg_price=menu.nonveg_price,
        veg_kid_price=menu.veg_kid_price,
        nonveg_kid_price=menu.nonveg_kid_price,
        veg_menu=menu.veg_menu,
        nonveg_menu=menu.nonveg_menu,
        created_by=current_user["sub"],
    )


@router.get("/menus/", response_model=list[CouponMenuResponse])
async def list_menus(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
):
    return get_coupon_menus(db, include_inactive=include_inactive)


@router.get("/menus/by-event/{event_name}", response_model=CouponMenuResponse)
async def get_menu_by_event(event_name: str, db: Session = Depends(get_db)):
    menu = get_coupon_menu_by_event(db, event_name)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.get("/menus/{menu_id}", response_model=CouponMenuResponse)
async def get_menu(menu_id: str, db: Session = Depends(get_db)):
    menu = get_coupon_menu_by_id(db, menu_id)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.put("/menus/{menu_id}", response_model=CouponMenuResponse)
async def edit_menu(
    menu_id: str,
    update: CouponMenuUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    menu = update_coupon_menu(db, menu_id, **update.model_dump(exclude_unset=True))
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


@router.delete("/menus/{menu_id}")
async def remove_menu(
    menu_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    if not delete_coupon_menu(db, menu_id):
        raise HTTPException(status_code=404, detail="Menu not found")
    return {"message": "Menu deactivated"}


@router.post("/menus/{menu_id}/image", response_model=CouponMenuResponse)
async def upload_menu_image(
    menu_id: str,
    image_type: str,  # 'veg' or 'nonveg'
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    if image_type not in ("veg", "nonveg"):
        raise HTTPException(status_code=400, detail="image_type must be 'veg' or 'nonveg'")
    content = await image.read()
    saved = save_upload_file(content, folder="../storage/menu_images", original_filename=image.filename)
    menu = set_menu_image(db, menu_id, saved, image_type)
    if not menu:
        raise HTTPException(status_code=404, detail="Menu not found")
    return menu


# ---------- Bookings ----------

@router.post("/", response_model=CouponResponse)
async def book_coupon(
    coupon: CouponCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        booking = create_coupon(
            db,
            tower=coupon.tower,
            unit_number=coupon.unit_number,
            contact_number=coupon.contact_number,
            email=coupon.email,
            event_name=coupon.event_name,
            pax=coupon.pax,
            veg_count=coupon.veg_count,
            nonveg_count=coupon.nonveg_count,
            veg_kid_count=coupon.veg_kid_count,
            nonveg_kid_count=coupon.nonveg_kid_count,
            payment_method=coupon.payment_method,
            txn_reference=coupon.txn_reference,
            payer_upi_id=coupon.payer_upi_id,
            created_by=current_user["sub"],
        )
    except SubscriptionNotVerified as exc:
        raise HTTPException(status_code=403, detail=str(exc))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    delivery = email_booking_confirmation(booking, get_coupon_menu_by_event(db, booking.event_name))
    response = CouponResponse.model_validate(booking)
    response.delivery = delivery
    return response


@router.get("/", response_model=list[CouponResponse])
async def list_my_coupons(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """List the bookings made by the logged-in user."""
    return (
        db.query(Coupon)
        .filter(Coupon.created_by == current_user["sub"])
        .order_by(Coupon.created_at.desc())
        .all()
    )


@router.get("/event/{event_name}", response_model=list[CouponResponse])
async def get_event_coupons(
    event_name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    return get_coupons_by_event(db, event_name)


@router.get("/event/{event_name}/dashboard", response_model=EventDashboardResponse)
async def get_event_dashboard_endpoint(
    event_name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    return get_event_dashboard(db, event_name)


@router.get("/user/{email}", response_model=list[CouponResponse])
async def get_user_coupons_list(
    email: str,
    db: Session = Depends(get_db),
    _: dict = Depends(get_current_user),
):
    return get_user_coupons(db, email)


@router.get("/{coupon_id}", response_model=CouponResponse)
async def get_coupon(coupon_id: str, db: Session = Depends(get_db)):
    coupon = get_coupon_by_id(db, coupon_id)
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return coupon


@router.put("/{coupon_id}", response_model=CouponResponse)
async def edit_coupon(
    coupon_id: str,
    update: CouponUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        booking = update_coupon(
            db,
            coupon_id,
            actor=current_user["sub"],
            **update.model_dump(exclude_unset=True),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not booking:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return booking


# ---------- Ticket verification ----------

@router.post("/verify", response_model=CouponTicketResponse)
async def verify_ticket_endpoint(
    request: TicketVerifyRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        ticket = verify_ticket(db, request.code, used_by=current_user["sub"])
    except PaymentNotVerified:
        raise HTTPException(
            status_code=402,
            detail="Payment for this booking has not been verified by admin yet. Please verify the payment before scanning.",
        )
    except TicketAlreadyUsed as exc:
        t = exc.ticket
        when = t.used_at.isoformat() if t.used_at else "earlier"
        raise HTTPException(
            status_code=409,
            detail=f"This coupon QR is already used (at {when}{f' by {t.used_by}' if t.used_by else ''}).",
        )
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


@router.get("/tickets/{ticket_id}", response_model=CouponTicketResponse)
async def get_ticket(ticket_id: str, db: Session = Depends(get_db)):
    ticket = get_ticket_by_id(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    return ticket


# ---------- Occasion lookup (admin-managed) ----------

@router.get("/occasions/", response_model=list[OccasionOptionResponse])
async def list_occasion_options(db: Session = Depends(get_db)):
    return list_coupon_occasions(db)


@router.post("/occasions/", response_model=OccasionOptionResponse)
async def add_occasion_option(
    payload: OccasionOptionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        return add_coupon_occasion(db, name=payload.name, created_by=current_user["sub"])
    except DuplicateOccasion:
        raise HTTPException(status_code=409, detail=f"Occasion '{payload.name}' already exists")


@router.delete("/occasions/{option_id}")
async def delete_occasion_option(
    option_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        ok = delete_coupon_occasion(db, option_id)
    except OccasionInUse as exc:
        raise HTTPException(
            status_code=409,
            detail=f"Cannot delete '{exc}': events still tagged with this occasion",
        )
    if not ok:
        raise HTTPException(status_code=404, detail="Occasion not found")
    return {"message": "Deleted"}


@router.patch("/occasions/{option_id}", response_model=OccasionOptionResponse)
async def rename_occasion_option(
    option_id: str,
    payload: OccasionOptionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    try:
        option = rename_coupon_occasion(db, option_id, new_name=payload.name)
    except DuplicateOccasion:
        raise HTTPException(status_code=409, detail=f"Occasion '{payload.name}' already exists")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not option:
        raise HTTPException(status_code=404, detail="Occasion not found")
    return option


# ---------- Payment helpers ----------

@router.get("/payment/info", response_model=PaymentInfoResponse)
async def payment_info(amount: float | None = None):
    uri = build_upi_uri(
        settings.COMMITTEE_UPI_ID,
        settings.COMMITTEE_UPI_NAME,
        amount=amount,
        note="Food coupons" if amount else None,
    )
    return PaymentInfoResponse(
        upi_id=settings.COMMITTEE_UPI_ID,
        upi_name=settings.COMMITTEE_UPI_NAME,
        upi_uri=uri,
    )


@router.get("/payment/qr")
async def payment_qr(amount: float):
    """Return a PNG QR code that opens the committee UPI VPA for the given amount."""
    uri = build_upi_uri(
        settings.COMMITTEE_UPI_ID,
        settings.COMMITTEE_UPI_NAME,
        amount=amount,
        note="Food coupons",
    )
    path = generate_qrcode(uri, folder="../storage/payment_qrs", filename=f"upi_{amount:.2f}.png")
    with open(path, "rb") as f:
        return Response(content=f.read(), media_type="image/png")
