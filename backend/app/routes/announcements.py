from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.announcement import AnnouncementCreate, AnnouncementUpdate, AnnouncementResponse
from app.services.announcement_service import (
    create_announcement, get_announcements, get_announcement_by_id,
    update_announcement, delete_announcement
)
from app.utils.jwt_handler import get_current_user

router = APIRouter(prefix="/api/announcements", tags=["announcements"])

@router.post("/", response_model=AnnouncementResponse)
async def create_new_announcement(
    announcement: AnnouncementCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new announcement (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create announcements")

    db_announcement = create_announcement(
        db,
        title=announcement.title,
        content=announcement.content,
        created_by=current_user["sub"],
        visible_until=announcement.visible_until,
    )

    return db_announcement

@router.get("/", response_model=list[AnnouncementResponse])
async def list_announcements(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all active announcements"""
    return get_announcements(db, skip, limit)

@router.get("/{announcement_id}", response_model=AnnouncementResponse)
async def get_announcement(announcement_id: str, db: Session = Depends(get_db)):
    """Get specific announcement"""
    announcement = get_announcement_by_id(db, announcement_id)
    if not announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return announcement

@router.put("/{announcement_id}", response_model=AnnouncementResponse)
async def update_existing_announcement(
    announcement_id: str,
    announcement: AnnouncementUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Update announcement (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can update announcements")

    db_announcement = update_announcement(
        db,
        announcement_id,
        title=announcement.title,
        content=announcement.content,
        is_active=announcement.is_active,
        visible_until=announcement.visible_until,
    )

    if not db_announcement:
        raise HTTPException(status_code=404, detail="Announcement not found")

    return db_announcement

@router.delete("/{announcement_id}")
async def delete_existing_announcement(
    announcement_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    """Delete announcement (Admin only)"""
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Only admins can delete announcements")

    if not delete_announcement(db, announcement_id):
        raise HTTPException(status_code=404, detail="Announcement not found")

    return {"message": "Announcement deleted successfully"}
