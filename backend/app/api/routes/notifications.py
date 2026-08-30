from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Notification, Profile
from app.schemas.screening import NotificationResponse

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(db: Session = Depends(get_db)):
    # Default to current profile notifications or all recent
    notifications = db.query(Notification).order_by(Notification.created_at.desc()).limit(50).all()
    return notifications

@router.get("/unread-count")
def get_unread_count(db: Session = Depends(get_db)):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"unread_count": count}

@router.post("/{notification_id}/read")
def mark_notification_read(notification_id: str, db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notification_id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.post("/mark-all-read")
def mark_all_read(db: Session = Depends(get_db)):
    db.query(Notification).filter(Notification.is_read == False).update({Notification.is_read: True})
    db.commit()
    return {"message": "All notifications marked as read"}
