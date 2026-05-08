import os

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.event import EventCreate, EventResponse, EventUpdate
from app.services.event_service import (
    create_event,
    delete_event,
    get_event,
    list_events,
    set_event_image,
    update_event,
)
from app.config import settings
from app.utils.file_handler import save_upload_file
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/events", tags=["events"])


def _require_admin_or_generic(current_user: dict):
    if current_user.get("role") not in ("admin", "generic"):
        raise HTTPException(status_code=403, detail="Admin or generic role required")


@router.get("/", response_model=list[EventResponse])
async def list_all(db: Session = Depends(get_db)):
    """Public — every authenticated resident can see the events calendar."""
    return list_events(db)


@router.post("/", response_model=EventResponse)
async def create_new(
    payload: EventCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    return create_event(
        db,
        title=payload.title,
        description=payload.description,
        start_date=payload.start_date,
        end_date=payload.end_date,
        created_by=current_user["sub"],
    )


@router.get("/{event_id}", response_model=EventResponse)
async def get_one(event_id: str, db: Session = Depends(get_db)):
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.put("/{event_id}", response_model=EventResponse)
async def update_one(
    event_id: str,
    payload: EventUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    event = update_event(db, event_id, **payload.model_dump(exclude_unset=True))
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event


@router.delete("/{event_id}")
async def delete_one(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    if not delete_event(db, event_id):
        raise HTTPException(status_code=404, detail="Event not found")
    return {"message": "Deleted"}


@router.post("/{event_id}/image", response_model=EventResponse)
async def upload_image(
    event_id: str,
    image: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    _require_admin_or_generic(current_user)
    event = get_event(db, event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    content = await image.read()
    folder = os.path.join(settings.UPLOAD_FOLDER, "event_images")
    saved = save_upload_file(content, folder=folder, original_filename=image.filename)
    return set_event_image(db, event_id, saved)
