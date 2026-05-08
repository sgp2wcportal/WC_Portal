from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import (
    FullUserResponse,
    TokenResponse,
    UserLogin,
    UserSignUp,
)
from app.services.auth_service import (
    EmailTaken,
    UsernameTaken,
    authenticate_user,
    create_access_token_for_user,
    register_resident,
)
from app.utils.registration_email import send_registration_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login endpoint — works for the seeded demo accounts AND for residents who signed up."""
    user = authenticate_user(credentials.username, credentials.password, db)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    access_token = create_access_token_for_user(user)
    role_value = user.role.value if hasattr(user.role, "value") else str(user.role)
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role_value,
    }


@router.post("/register", response_model=FullUserResponse)
async def register(payload: UserSignUp, db: Session = Depends(get_db)):
    """Public sign-up — creates a resident account (role=user)."""
    try:
        user = register_resident(
            db,
            username=payload.username,
            password=payload.password,
            name=payload.name,
            email=payload.email,
            contact_number=payload.contact_number,
            tower=payload.tower,
            unit_number=payload.unit_number,
            is_rented=payload.is_rented,
            owner_name=payload.owner_name,
            owner_contact_number=payload.owner_contact_number,
        )
    except UsernameTaken:
        raise HTTPException(status_code=409, detail=f"Username '{payload.username}' is already taken")
    except EmailTaken:
        raise HTTPException(status_code=409, detail=f"An account with email '{payload.email}' already exists")

    # Best-effort: send the welcome email with their credentials. Failure here
    # shouldn't block the registration itself.
    try:
        send_registration_email(user=user, password=payload.password)
    except Exception:  # pragma: no cover — logged by the mailer
        pass

    return user
