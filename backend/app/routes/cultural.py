import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.cultural_registration import CulturalRegistration
from app.schemas.cultural_registration import (
    CULTURAL_CATEGORIES,
    CulturalRegistrationCreate,
    CulturalRegistrationResponse,
    CulturalRegistrationUpdate,
)
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/cultural", tags=["cultural"])


@router.get("/categories")
async def list_categories(_: dict = Depends(get_current_user)):
    return CULTURAL_CATEGORIES


@router.get("/", response_model=list[CulturalRegistrationResponse])
async def list_registrations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") == "admin":
        return db.query(CulturalRegistration).order_by(CulturalRegistration.created_at.desc()).all()
    # Regular users see only their own entries (matched by created_by username)
    return (
        db.query(CulturalRegistration)
        .filter(CulturalRegistration.created_by == current_user["sub"])
        .order_by(CulturalRegistration.created_at.desc())
        .all()
    )


@router.post("/", response_model=CulturalRegistrationResponse)
async def create_registration(
    payload: CulturalRegistrationCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    reg = CulturalRegistration(
        id=str(uuid.uuid4()),
        **payload.model_dump(),
        created_by=current_user["sub"],
    )
    db.add(reg)
    db.commit()
    db.refresh(reg)
    return reg


@router.put("/{reg_id}", response_model=CulturalRegistrationResponse)
async def update_registration(
    reg_id: str,
    payload: CulturalRegistrationUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required to edit registrations")
    reg = db.query(CulturalRegistration).filter(CulturalRegistration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(reg, field, value)
    db.commit()
    db.refresh(reg)
    return reg


@router.delete("/{reg_id}")
async def delete_registration(
    reg_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin role required to delete registrations")
    reg = db.query(CulturalRegistration).filter(CulturalRegistration.id == reg_id).first()
    if not reg:
        raise HTTPException(status_code=404, detail="Registration not found")
    db.delete(reg)
    db.commit()
    return {"message": "Deleted"}
