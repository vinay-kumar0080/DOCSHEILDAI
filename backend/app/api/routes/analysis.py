from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ScreeningSession
from app.schemas.screening import (
    OCRResponse, MRZResponse, TamperingResponse,
    FaceVerificationResponse, RiskAssessmentResponse
)

router = APIRouter(prefix="/screenings/{screening_id}", tags=["Analysis Sub-Modules"])

@router.get("/ocr", response_model=OCRResponse)
def get_ocr_analysis(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening or not screening.ocr_result:
        raise HTTPException(status_code=404, detail="OCR analysis not available for this screening")
    return screening.ocr_result

@router.get("/mrz", response_model=MRZResponse)
def get_mrz_analysis(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening or not screening.mrz_result:
        raise HTTPException(status_code=404, detail="MRZ analysis not available for this screening")
    return screening.mrz_result

@router.get("/validation")
def get_validation_analysis(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    return screening.validation_results

@router.get("/tampering", response_model=TamperingResponse)
def get_tampering_analysis(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening or not screening.tampering_result:
        raise HTTPException(status_code=404, detail="Tampering analysis not available for this screening")
    return screening.tampering_result

@router.get("/face", response_model=FaceVerificationResponse)
def get_face_analysis(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening or not screening.face_result:
        raise HTTPException(status_code=404, detail="Face analysis not available for this screening")
    return screening.face_result

@router.get("/risk", response_model=RiskAssessmentResponse)
def get_risk_analysis(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening or not screening.risk_assessment:
        raise HTTPException(status_code=404, detail="Risk assessment not available for this screening")
    return screening.risk_assessment
