from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import SystemSetting, Profile
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["System Settings & Preferences"])

class SettingsUpdate(BaseModel):
    preferences: Dict[str, Any]

@router.get("")
def get_settings(db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).first()
    if not setting:
        default_prefs = {
            "theme": "dark",
            "language": "en",
            "timezone": "UTC",
            "date_format": "YYYY-MM-DD",
            "retention_hours": 24,
            "sensitivity": "standard",
            "auto_mrz_validation": True,
            "two_factor_auth": False
        }
        return {"preferences": default_prefs}
    return {"preferences": setting.preferences}

@router.patch("")
def update_settings(data: SettingsUpdate, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).first()
    if not setting:
        setting = SystemSetting(preferences=data.preferences)
        db.add(setting)
    else:
        current = dict(setting.preferences or {})
        current.update(data.preferences)
        setting.preferences = current
    
    db.commit()
    return {"message": "Settings updated successfully", "preferences": setting.preferences}
