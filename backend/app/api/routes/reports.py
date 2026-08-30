import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import ScreeningSession, Report
from app.services.report_service import report_service

router = APIRouter(tags=["Reports"])

@router.get("/screenings/{screening_id}/report")
def get_or_generate_report(screening_id: str, db: Session = Depends(get_db)):
    screening = db.query(ScreeningSession).filter(ScreeningSession.id == screening_id).first()
    if not screening:
        raise HTTPException(status_code=404, detail="Screening session not found")

    # Serialize screening dictionary for report generation
    screening_dict = {
        "id": screening.id,
        "domain": screening.domain,
        "document_type": screening.document_type,
        "risk_score": screening.risk_score,
        "risk_level": screening.risk_level,
        "created_at": screening.created_at,
        "ocr_result": {
            "structured_fields": screening.ocr_result.structured_fields if screening.ocr_result else {},
            "average_confidence": screening.ocr_result.average_confidence if screening.ocr_result else 0.95
        },
        "mrz_result": {
            "mrz_detected": screening.mrz_result.mrz_detected if screening.mrz_result else False,
            "mrz_text": screening.mrz_result.mrz_text if screening.mrz_result else None,
            "document_number": screening.mrz_result.document_number if screening.mrz_result else None,
            "date_of_birth": screening.mrz_result.date_of_birth if screening.mrz_result else None,
            "expiry_date": screening.mrz_result.expiry_date if screening.mrz_result else None,
            "checksums": screening.mrz_result.checksums if screening.mrz_result else {}
        },
        "tampering_result": {
            "tampering_detected": screening.tampering_result.tampering_detected if screening.tampering_result else False,
            "score": screening.tampering_result.score if screening.tampering_result else 0.1
        },
        "face_result": {
            "status": screening.face_result.status if screening.face_result else "NOT_EVALUATED",
            "similarity": screening.face_result.similarity if screening.face_result else 0.0
        }
    }

    pdf_path = report_service.generate_pdf(screening_dict)
    
    # Store or update report record
    rep = db.query(Report).filter(Report.screening_id == screening_id).first()
    if not rep:
        rep = Report(screening_id=screening_id, report_path=pdf_path)
        db.add(rep)
        db.commit()

    return FileResponse(
        pdf_path,
        media_type="application/pdf",
        filename=os.path.basename(pdf_path)
    )
