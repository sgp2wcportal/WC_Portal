import uuid
from datetime import datetime

from sqlalchemy.orm import Session

from app.models.event import CommunityEvent


def list_events(db: Session, *, skip: int = 0, limit: int = 1000):
    """Newest scheduled events first (descending start_date)."""
    return (
        db.query(CommunityEvent)
        .order_by(CommunityEvent.start_date.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_event(db: Session, event_id: str):
    return db.query(CommunityEvent).filter(CommunityEvent.id == event_id).first()


def create_event(
    db: Session,
    *,
    title: str,
    description: str,
    start_date: datetime,
    end_date: datetime | None,
    created_by: str,
) -> CommunityEvent:
    event = CommunityEvent(
        id=str(uuid.uuid4()),
        title=title.strip(),
        description=description or "",
        start_date=start_date,
        end_date=end_date,
        created_by=created_by,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def update_event(db: Session, event_id: str, **fields) -> CommunityEvent | None:
    event = get_event(db, event_id)
    if not event:
        return None
    for key, value in fields.items():
        if value is not None and hasattr(event, key):
            setattr(event, key, value)
    db.commit()
    db.refresh(event)
    return event


def delete_event(db: Session, event_id: str) -> bool:
    event = get_event(db, event_id)
    if not event:
        return False
    db.delete(event)
    db.commit()
    return True


def set_event_image(db: Session, event_id: str, image_path: str) -> CommunityEvent | None:
    event = get_event(db, event_id)
    if not event:
        return None
    event.image = image_path
    db.commit()
    db.refresh(event)
    return event
