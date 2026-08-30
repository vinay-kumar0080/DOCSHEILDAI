from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProfileBase(BaseModel):
    email: str
    full_name: str
    role: str = "analyst"
    domain: str = "airport_security"
    organization: Optional[str] = "DocShield Security Command"
    avatar_url: Optional[str] = None

class ProfileCreate(ProfileBase):
    pass

class ProfileResponse(ProfileBase):
    id: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DocumentUploadResponse(BaseModel):
    id: str
    screening_id: str
    original_filename: str
    mime_type: str
    file_size: int
    width: Optional[int] = None
    height: Optional[int] = None
    doc_role: str
    created_at: datetime

    class Config:
        from_attributes = True

class ScreeningCreate(BaseModel):
    domain: str = Field(..., description="airline, immigration, airport_security, border_travel")
    document_type: str = Field(..., description="passport, visa, national_id, driving_license, residence_permit, travel_permit, boarding_pass, compare_documents, face_verification")
    person_name: Optional[str] = Field("Screening Subject", description="Operator-provided person name as screening reference")
    travel_reference: Optional[Dict[str, Any]] = Field(None, description="Optional e-ticket / booking reference metadata")
    user_id: Optional[str] = None
    is_demo: bool = False

class ScreeningStatusResponse(BaseModel):
    id: str
    person_name: Optional[str] = "Screening Subject"
    domain: str
    document_type: str
    status: str
    stage: str
    risk_score: float
    risk_level: str
    manual_review_required: bool
    is_demo: bool
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class ContributorSignal(BaseModel):
    title: str
    points: float
    severity: str  # low, medium, high, positive
    description: str

class RiskAssessmentResponse(BaseModel):
    risk_score: float
    risk_level: str
    contributors: List[ContributorSignal]
    explanation: Dict[str, Any]
    recommendation: str

    class Config:
        from_attributes = True

class ValidationItemResponse(BaseModel):
    check_name: str
    status: str  # PASS, WARNING, FAIL, INFO
    severity: str
    message: str
    details: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class OCRResponse(BaseModel):
    raw_text: Optional[str] = None
    structured_fields: Optional[Dict[str, Any]] = None
    average_confidence: float = 0.0
    bounding_boxes: Optional[List[Dict[str, Any]]] = None

    class Config:
        from_attributes = True

class MRZResponse(BaseModel):
    mrz_detected: bool
    mrz_text: Optional[str] = None
    document_number: Optional[str] = None
    date_of_birth: Optional[str] = None
    expiry_date: Optional[str] = None
    nationality: Optional[str] = None
    issuer: Optional[str] = None
    sex: Optional[str] = None
    checksums: Optional[Dict[str, Any]] = None
    is_valid: bool = False
    confidence: float = 0.0
    field_matches: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class SuspiciousRegion(BaseModel):
    x: int
    y: int
    width: int
    height: int
    reason: str
    score: float

class TamperingResponse(BaseModel):
    tampering_detected: bool
    score: float
    confidence: float
    status: str
    suspicious_regions: Optional[List[SuspiciousRegion]] = None
    heatmap_base64: Optional[str] = None
    signals: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class FaceVerificationResponse(BaseModel):
    face_detected_document: bool
    face_detected_live: bool
    face_count_document: int
    face_count_live: int
    similarity: float
    status: str
    confidence: float
    document_face_box: Optional[Dict[str, int]] = None
    live_face_box: Optional[Dict[str, int]] = None

    class Config:
        from_attributes = True

class ScreeningDetailResponse(BaseModel):
    id: str
    person_name: Optional[str] = "Screening Subject"
    domain: str
    document_type: str
    travel_reference: Optional[Dict[str, Any]] = None
    status: str
    stage: str
    risk_score: float
    risk_level: str
    manual_review_required: bool
    is_demo: bool
    created_at: datetime
    completed_at: Optional[datetime] = None
    documents: List[DocumentUploadResponse] = []
    ocr_result: Optional[OCRResponse] = None
    mrz_result: Optional[MRZResponse] = None
    validation_results: List[ValidationItemResponse] = []
    tampering_result: Optional[TamperingResponse] = None
    face_result: Optional[FaceVerificationResponse] = None
    risk_assessment: Optional[RiskAssessmentResponse] = None

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: str
    title: str
    message: str
    type: str
    is_read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
