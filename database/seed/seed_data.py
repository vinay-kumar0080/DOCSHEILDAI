import uuid
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.database import engine, Base, SessionLocal
from app.db.models import (
    Profile, ScreeningSession, UploadedDocument, OCRResult,
    MRZResult, ValidationResult, TamperingResult, FaceResult,
    RiskAssessment, AuditLog
)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db: Session = SessionLocal()

    # Check if records already exist
    if db.query(ScreeningSession).count() > 0:
        db.close()
        return

    print("Seeding synthetic demo records into DocShield AI database...")

    # 1. Create Default Profiles
    officer_airport = Profile(
        id=str(uuid.uuid4()),
        email="officer.alex@airport-security.gov",
        full_name="Officer Alex Vance",
        role="administrator",
        domain="airport_security"
    )
    officer_airline = Profile(
        id=str(uuid.uuid4()),
        email="agent.sarah@skyairways.com",
        full_name="Agent Sarah Connor",
        role="analyst",
        domain="airline"
    )
    officer_immigration = Profile(
        id=str(uuid.uuid4()),
        email="inspector.david@border-control.gov",
        full_name="Inspector David Thorne",
        role="analyst",
        domain="immigration"
    )
    db.add_all([officer_airport, officer_airline, officer_immigration])
    db.commit()

    # 2. Sample 1: Low Risk US Passport
    s1_id = str(uuid.uuid4())
    s1 = ScreeningSession(
        id=s1_id,
        user_id=officer_airport.id,
        domain="airport_security",
        document_type="passport",
        status="completed",
        stage="completed",
        risk_score=14.5,
        risk_level="LOW_RISK",
        manual_review_required=False,
        is_demo=True,
        created_at=datetime.utcnow() - timedelta(hours=2),
        completed_at=datetime.utcnow() - timedelta(hours=2, minutes=-1)
    )
    db.add(s1)

    s1_doc = UploadedDocument(
        id=str(uuid.uuid4()),
        screening_id=s1_id,
        storage_path="storage/uploads/sample_us_passport.jpg",
        original_filename="US_Passport_AlexanderChen.jpg",
        mime_type="image/jpeg",
        file_size=1420500,
        doc_role="primary_document"
    )
    db.add(s1_doc)

    s1_ocr = OCRResult(
        id=str(uuid.uuid4()),
        screening_id=s1_id,
        raw_text="PASSPORT\nUNITED STATES OF AMERICA\nSurname: CHEN\nGiven Names: ALEXANDER\nPassport No: P89234561\nNationality: USA\nDOB: 14 MAY 1992\nSex: M\nEXP: 20 AUG 2031\nP<USACHEN<<ALEXANDER<<<<<<<<<<<<<<<<<<<<<<<<<\nP892345617USA9205148M3108204<<<<<<<<<<<<<<02",
        structured_fields={
            "name": "ALEXANDER CHEN",
            "document_number": "P89234561",
            "nationality": "USA",
            "date_of_birth": "1992-05-14",
            "gender": "M",
            "expiry_date": "2031-08-20",
            "issuing_country": "USA"
        },
        average_confidence=0.98
    )
    db.add(s1_ocr)

    s1_mrz = MRZResult(
        id=str(uuid.uuid4()),
        screening_id=s1_id,
        mrz_detected=True,
        mrz_text="P<USACHEN<<ALEXANDER<<<<<<<<<<<<<<<<<<<<<<<<<\nP892345617USA9205148M3108204<<<<<<<<<<<<<<02",
        document_number="P89234561",
        date_of_birth="1992-05-14",
        expiry_date="2031-08-20",
        nationality="USA",
        issuer="USA",
        sex="M",
        checksums={
            "document_number": True,
            "date_of_birth": True,
            "expiry_date": True,
            "composite": True
        },
        is_valid=True,
        confidence=0.98,
        field_matches={"document_number_match": True, "nationality_match": True}
    )
    db.add(s1_mrz)

    db.add(ValidationResult(
        id=str(uuid.uuid4()),
        screening_id=s1_id,
        check_name="Document Expiry Date",
        status="PASS",
        severity="info",
        message="Document is valid until 2031-08-20."
    ))

    s1_tamper = TamperingResult(
        id=str(uuid.uuid4()),
        screening_id=s1_id,
        tampering_detected=False,
        score=0.12,
        confidence=0.94,
        status="CLEAR",
        suspicious_regions=[],
        signals={"ela_metric": 0.08, "fft_high_freq_ratio": 1.05, "noise_variance_inconsistency": 0.12}
    )
    db.add(s1_tamper)

    s1_face = FaceResult(
        id=str(uuid.uuid4()),
        screening_id=s1_id,
        face_detected_document=True,
        face_detected_live=True,
        face_count_document=1,
        face_count_live=1,
        similarity=0.91,
        status="MATCH_SIGNAL",
        confidence=0.95
    )
    db.add(s1_face)

    s1_risk = RiskAssessment(
        id=str(uuid.uuid4()),
        screening_id=s1_id,
        risk_score=14.5,
        risk_level="LOW_RISK",
        contributors=[
            {"title": "Clean Forensic Image Integrity", "points": -5.0, "severity": "positive", "description": "No ELA or noise splicing anomalies."},
            {"title": "Valid ICAO 9303 MRZ Checksums", "points": -8.0, "severity": "positive", "description": "All mathematical checksums passed."},
            {"title": "Strong Face Match Signal", "points": -10.0, "severity": "positive", "description": "91% facial embedding similarity."}
        ],
        explanation={
            "summary": "Document passed all primary forensic and mathematical checksum tests.",
            "checks_passed": ["Forensic Image Integrity", "ICAO 9303 MRZ Checksums", "Biometric Face Comparison", "Document Expiry Date"],
            "checks_failed": []
        },
        recommendation="Standard operational procedures apply."
    )
    db.add(s1_risk)

    # 3. Sample 2: High Risk Tampered Visa
    s2_id = str(uuid.uuid4())
    s2 = ScreeningSession(
        id=s2_id,
        user_id=officer_immigration.id,
        domain="immigration",
        document_type="visa",
        status="completed",
        stage="completed",
        risk_score=78.0,
        risk_level="HIGH_RISK",
        manual_review_required=True,
        is_demo=True,
        created_at=datetime.utcnow() - timedelta(hours=5),
        completed_at=datetime.utcnow() - timedelta(hours=5, minutes=-1)
    )
    db.add(s2)

    s2_tamper = TamperingResult(
        id=str(uuid.uuid4()),
        screening_id=s2_id,
        tampering_detected=True,
        score=0.86,
        confidence=0.88,
        status="HIGH_ANOMALY",
        suspicious_regions=[
            {"x": 120, "y": 80, "width": 240, "height": 110, "reason": "Date of Expiry numerical font splice and compression grid discontinuity", "score": 0.88},
            {"x": 450, "y": 190, "width": 180, "height": 220, "reason": "Portrait boundary noise gradient inconsistency", "score": 0.82}
        ],
        signals={"ela_metric": 0.58, "fft_high_freq_ratio": 2.15, "noise_variance_inconsistency": 0.72}
    )
    db.add(s2_tamper)

    s2_mrz = MRZResult(
        id=str(uuid.uuid4()),
        screening_id=s2_id,
        mrz_detected=True,
        mrz_text="VNUSAGONZALEZ<<MARIA<<<<<<<<<<<<<<<<<<<<<<<<\nV4490182<5ESP8811031F2801103<<<<<<<<<<<<<<00",
        document_number="V4490182",
        date_of_birth="1988-11-03",
        expiry_date="2028-01-10",
        checksums={"document_number": False, "date_of_birth": True, "expiry_date": False, "composite": False},
        is_valid=False,
        confidence=0.74,
        field_matches={"document_number_match": False}
    )
    db.add(s2_mrz)

    s2_risk = RiskAssessment(
        id=str(uuid.uuid4()),
        screening_id=s2_id,
        risk_score=78.0,
        risk_level="HIGH_RISK",
        contributors=[
            {"title": "Potential Document Manipulation Detected", "points": +30.0, "severity": "high", "description": "Splice anomalies in expiry date and portrait boundary."},
            {"title": "MRZ ICAO 9303 Checksum Anomaly", "points": +25.0, "severity": "high", "description": "Document number & expiry date checksums failed."},
            {"title": "MRZ & Visual Text Mismatch", "points": +20.0, "severity": "high", "description": "Visible visa number does not match MRZ encoded string."}
        ],
        explanation={
            "summary": "High risk forensic tampering and checksum failure detected.",
            "checks_passed": ["Image Optical Quality"],
            "checks_failed": ["Forensic Image Integrity", "ICAO 9303 MRZ Checksums", "Cross-Field Consistency"]
        },
        recommendation="Mandatory manual forensic physical verification required by senior border control officer."
    )
    db.add(s2_risk)

    db.commit()
    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
