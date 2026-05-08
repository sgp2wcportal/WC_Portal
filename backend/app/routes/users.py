from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.user import ChangePasswordRequest, FullUserResponse, UserUpdate
from app.services.auth_service import (
    CurrentPasswordWrong,
    EmailTaken,
    change_user_password,
    get_user_by_username,
    update_user_profile,
)
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/users", tags=["users"])


def _load_me(db: Session, current_user: dict):
    user = get_user_by_username(db, current_user["sub"])
    if not user:
        raise HTTPException(status_code=404, detail="Account not found")
    return user


@router.get("/me", response_model=FullUserResponse)
async def get_me(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return _load_me(db, current_user)


@router.patch("/me", response_model=FullUserResponse)
async def update_me(
    payload: UserUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = _load_me(db, current_user)
    try:
        return update_user_profile(db, user, **payload.model_dump(exclude_unset=True))
    except EmailTaken:
        raise HTTPException(status_code=409, detail="That email is already used by another account")


@router.post("/me/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user = _load_me(db, current_user)
    try:
        change_user_password(
            db, user,
            current_password=payload.current_password,
            new_password=payload.new_password,
        )
    except CurrentPasswordWrong:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"message": "Password updated"}
