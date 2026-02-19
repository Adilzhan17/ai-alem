"""
Notification helper — creates in-app notifications for users.
"""
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session

from app.models.estate import Notification


def send_notification(
    db: Session,
    *,
    user_id: int,
    title: str,
    content: str,
    type: str = "system",
    link: Optional[str] = None,
    entity_type: Optional[str] = None,
    entity_id: Optional[int] = None,
) -> Notification:
    """
    Create an in-app notification for a user.
    """
    notif = Notification(
        user_id=user_id,
        title=title,
        content=content,
        type=type,
        link=link,
        entity_type=entity_type,
        entity_id=entity_id,
        is_read=False,
        created_at=datetime.utcnow(),
    )
    db.add(notif)
    db.commit()
    db.refresh(notif)
    return notif
