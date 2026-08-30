import os
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, BackgroundTasks, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ScreeningSession, UploadedDocument, Profile, AuditLog
from app.schemas.screening import (
    ScreeningCreate, ScreeningStatusResponse, ScreeningDetailResponse,
    DocumentUploadResponse
)
from app.services.storage_service import storage_service
from app.services.screening_service import screening_service

router = APIRouter(prefix="/screenings", tags=["Screenings"])

@router.post("", response_model=ScreeningStatusResponse)
def create_screening(data: ScreeningCreate, db: Session = Depends(get_db)):
    # 1. Resolve Officer Profile
    user = None
    if data.user_id:
        user = db.query(Profile).filter(Profile.id == data.user_id).first()
    if not user:
        user = db.query(Profile).first()
        if not user:
            user = Profile(email="officer@docshield.ai", full_name="Authorized Officer", domain=data.domain)
            db.add(user)
            db.commit()
            db.refresh(user)

    person_name = (data.person_name or "Screening Subject").strip()

    # 2. Create Screening Session with unique internal UUID
    screening = ScreeningSession(
        person_name=person_name,
        travel_reference=data.travel_reference,
        user_id=user.id,
        domain=data.domain,
        document_type=data.document_type,
        status="created",
        stage="pending",
        is_demo=data.is_demo
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)
    return screening

@router.post("/{screening_id}/upload", response_model=DocumentUploadResponse)
def upload_document(
    screening_id: str,
    file: UploadFile = File(...),
    doc_role: str = Form("primary_document"),
    db: Session = Depends(get_db)
):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")

    saved_path = storage_service.save_upload_file(file, screening_id)
    file_size = os.path.getsize(saved_path)

    doc = UploadedDocument(
        screening_id=screening_id,
        storage_path=saved_path,
        original_filename=file.filename or "uploaded_document.jpg",
        mime_type=file.content_type or "image/jpeg",
        file_size=file_size,
        doc_role=doc_role
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc

@router.post("/{screening_id}/analyze")
def start_screening_analysis(
    screening_id: str,
    background_tasks: BackgroundTasks,
    is_tampered_simulation: bool = False,
    db: Session = Depends(get_db)
):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")

    screening.status = "queued"
    screening.stage = "queued"
    db.commit()

    # Pass None for db so background task safely spawns its own session
    background_tasks.add_task(screening_service.process_screening, screening_id, None, is_tampered_simulation)

    return {
        "screening_id": screening_id,
        "status": "processing",
        "message": "AI multi-modal screening pipeline initiated."
    }

@router.get("/{screening_id}/status", response_model=ScreeningStatusResponse)
def get_screening_status(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")
    return screening

@router.get("/{screening_id}", response_model=ScreeningDetailResponse)
def get_screening_detail(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")
    
    return ScreeningDetailResponse.from_orm(screening)

@router.get("", response_model=List[ScreeningDetailResponse])
def list_screenings(
    domain: Optional[str] = None,
    document_type: Optional[str] = None,
    risk_level: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    query = db.query(ScreeningSession)
    if domain and domain != "all":
        query = query.filter(ScreeningSession.domain == domain)
    if document_type and document_type != "all":
        query = query.filter(ScreeningSession.document_type == document_type)
    if risk_level and risk_level != "all":
        query = query.filter(ScreeningSession.risk_level == risk_level)
    
    if search:
        s = search.strip().lower()
        query = query.filter(
            (ScreeningSession.id.contains(s)) | 
            (ScreeningSession.person_name.ilike(f"%{s}%"))
        )

    screenings = query.order_by(ScreeningSession.created_at.desc()).limit(limit).all()
    return [ScreeningDetailResponse.from_orm(sc) for sc in screenings]

@router.delete("/{screening_id}")
def delete_screening(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")
    
    db.delete(screening)
    db.commit()
    return {"message": f"Screening session {screening_id} removed successfully."}
