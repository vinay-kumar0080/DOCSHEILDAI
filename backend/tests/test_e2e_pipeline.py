import os
import cv2
import numpy as np
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.ai.consistency.consistency_engine import consistency_engine

client = TestClient(app)

def test_health_and_diagnostics():
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] in ["healthy", "degraded"]
    assert data["database"] == "connected"
    assert data["storage"] == "connected"
    assert "ocr" in data
    assert "mrz" in data
    assert "tampering" in data
    assert "face" in data
    assert "pdf" in data

def test_models_status_diagnostics():
    res = client.get("/api/v1/models/status")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert "ocr" in data["models"]
    assert "mrz" in data["models"]
    assert "tampering" in data["models"]
    assert "face_detection" in data["models"]
    assert "face_recognition" in data["models"]
    assert "consistency_engine" in data["models"]
    assert "risk_engine" in data["models"]

def test_auth_profile_flow():
    email = "officer_test@docshield.ai"
    res = client.post("/api/v1/auth/profile", json={
        "email": email,
        "full_name": "Senior Inspector",
        "domain": "airport_security",
        "role": "analyst"
    })
    assert res.status_code == 200
    profile = res.json()
    assert profile["email"] == email

    res_get = client.get(f"/api/v1/auth/profile/{email}")
    assert res_get.status_code == 200
    assert res_get.json()["full_name"] == "Senior Inspector"

def test_consistency_engine():
    ocr_fields = {
        "name": "ALEXANDER CHEN",
        "document_number": "P89234561",
        "nationality": "USA",
        "issue_date": "2021-08-21",
        "expiry_date": "2031-08-20"
    }
    mrz_data = {
        "mrz_detected": True,
        "surname": "CHEN",
        "given_names": "ALEXANDER",
        "document_number": "P89234561",
        "nationality": "USA",
        "expiry_date": "2031-08-20"
    }
    res = consistency_engine.evaluate_consistency("passport", ocr_fields, mrz_data)
    assert res["is_consistent"] is True
    assert res["overall_status"] == "CONSISTENT"
    assert len(res["items"]) >= 3

def test_full_screening_pipeline_and_pdf_generation():
    # 1. Create Session
    create_res = client.post("/api/v1/screenings", json={
        "domain": "airport_security",
        "document_type": "passport",
        "is_demo": False
    })
    assert create_res.status_code == 200
    session_id = create_res.json()["id"]

    # 2. Upload Document
    canvas = np.zeros((600, 800, 3), dtype=np.uint8)
    cv2.putText(canvas, "PASSPORT P89234561 USA", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    _, buf = cv2.imencode(".jpg", canvas)

    upload_res = client.post(
        f"/api/v1/screenings/{session_id}/upload",
        data={"doc_role": "primary_document"},
        files={"file": ("passport_real.jpg", buf.tobytes(), "image/jpeg")}
    )
    assert upload_res.status_code == 200
    assert upload_res.json()["screening_id"] == session_id

    # 3. Start Analysis
    analyze_res = client.post(f"/api/v1/screenings/{session_id}/analyze")
    assert analyze_res.status_code == 200
    assert analyze_res.json()["status"] == "processing"

    # 4. Check Status
    status_res = client.get(f"/api/v1/screenings/{session_id}/status")
    assert status_res.status_code == 200
    assert status_res.json()["status"] == "completed"

    # 5. Fetch Full Dossier
    detail_res = client.get(f"/api/v1/screenings/{session_id}")
    assert detail_res.status_code == 200
    dossier = detail_res.json()
    assert dossier["id"] == session_id
    assert "risk_score" in dossier
    assert "risk_level" in dossier
    assert dossier["ocr_result"] is not None
    assert dossier["mrz_result"] is not None
    assert dossier["tampering_result"] is not None
    assert dossier["face_result"] is not None

    # 6. Generate & Validate PDF Report
    report_res = client.get(f"/api/v1/screenings/{session_id}/report")
    assert report_res.status_code == 200
    assert report_res.headers["content-type"] == "application/pdf"
    assert len(report_res.content) > 1000
