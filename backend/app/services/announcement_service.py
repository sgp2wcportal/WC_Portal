from datetime import datetime
from sqlalchemy import or_
from sqlalchemy.orm import Session
from app.models.announcement import Announcement
import uuid

def create_announcement(
    db: Session,
    title: str,
    content: str,
    created_by: str,
    visible_until: datetime | None = None,
) -> Announcement:
    announcement = Announcement(
        id=str(uuid.uuid4()),
        title=title,
        content=content,
        created_by=created_by,
        visible_until=visible_until,
    )
    db.add(announcement)
    db.commit()
    db.refresh(announcement)
    return announcement

def get_announcements(db: Session, skip: int = 0, limit: int = 100):
    now = datetime.utcnow()
    return (
        db.query(Announcement)
        .filter(Announcement.is_active == True)
        .filter(or_(Announcement.visible_until.is_(None), Announcement.visible_until > now))
        .order_by(Announcement.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_announcement_by_id(db: Session, announcement_id: str):
    return db.query(Announcement).filter(Announcement.id == announcement_id).first()

def update_announcement(db: Session, announcement_id: str, title: str = None, content: str = None, is_active: bool = None, visible_until: datetime | None = None):
    announcement = get_announcement_by_id(db, announcement_id)
    if not announcement:
        return None

    if title is not None:
        announcement.title = title
    if content is not None:
        announcement.content = content
    if is_active is not None:
        announcement.is_active = is_active
    if visible_until is not None:
        announcement.visible_until = visible_until

    db.commit()
    db.refresh(announcement)
    return announcement

def delete_announcement(db: Session, announcement_id: str):
    announcement = get_announcement_by_id(db, announcement_id)
    if announcement:
        announcement.is_active = False
        db.commit()
        return True
    return False
