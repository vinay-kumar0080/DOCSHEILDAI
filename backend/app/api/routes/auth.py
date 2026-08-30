from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import Profile, ScreeningSession
from app.schemas.screening import ProfileCreate, ProfileResponse

router = APIRouter(prefix="/auth", tags=["Authentication & Profiles"])

@router.post("/profile", response_model=ProfileResponse)
def create_or_get_profile(data: ProfileCreate, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.email == data.email).first()
    if not profile:
        profile = Profile(
            email=data.email,
            full_name=data.full_name,
            role=data.role,
            domain=data.domain,
            organization=data.organization or "DocShield Security Command",
            avatar_url=data.avatar_url
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)
    else:
        profile.full_name = data.full_name
        profile.domain = data.domain
        if data.organization:
            profile.organization = data.organization
        if data.avatar_url:
            profile.avatar_url = data.avatar_url
        db.commit()
        db.refresh(profile)
    return profile

@router.get("/profile/{email}", response_model=ProfileResponse)
def get_profile(email: str, db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.email == email).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.get("/me")
def get_current_profile_summary(db: Session = Depends(get_db)):
    profile = db.query(Profile).first()
    if not profile:
        profile = Profile(
            email="officer@docshield.ai",
            full_name="Chief Screening Officer",
            role="administrator",
            domain="airport_security",
            organization="DocShield Security Command"
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    completed_count = db.query(ScreeningSession).filter(ScreeningSession.status == "completed").count()

    return {
        "id": profile.id,
        "email": profile.email,
        "full_name": profile.full_name,
        "role": profile.role,
        "domain": profile.domain,
        "organization": profile.organization,
        "avatar_url": profile.avatar_url,
        "created_at": profile.created_at.isoformat(),
        "screenings_completed": completed_count,
        "status": "Active & Authorized"
    }
