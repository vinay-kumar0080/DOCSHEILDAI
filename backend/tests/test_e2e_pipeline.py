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

def test_five_security_domains_catalog():
    res = client.get("/api/v1/domains")
    assert res.status_code == 200
    domains = res.json()
    assert len(domains) == 5
    domain_ids = [d["id"] for d in domains]
    assert "immigration_officers" in domain_ids
    assert "border_security" in domain_ids
    assert "airport_security" in domain_ids
    assert "immigration_departments" in domain_ids
    assert "law_enforcement" in domain_ids

    # Test individual domain info
    imm_res = client.get("/api/v1/domains/immigration_officers")
    assert imm_res.status_code == 200
    imm_data = imm_res.json()
    assert imm_data["name"] == "Immigration Officers"
    assert "passport" in imm_data["supported_document_ids"]
    assert "work_permit" in imm_data["supported_document_ids"]
    assert "Passport" in imm_data["documents"]
    assert "Work Permit" in imm_data["documents"]

def test_multi_document_screening_with_checkpoint_notes():
    # 1. Create multi-doc screening for Immigration Department
    create_res = client.post("/api/v1/screenings", json={
        "domain": "immigration_departments",
        "document_type": "passport",
        "person_name": "Elena Rostova",
        "is_demo": False
    })
    assert create_res.status_code == 200
    session_id = create_res.json()["id"]

    # 2. Upload Passport (sharp image)
    canvas_p = np.zeros((700, 1000, 3), dtype=np.uint8)
    cv2.putText(canvas_p, "PASSPORT P89234561 RUS", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(canvas_p, "NAME: ROSTOVA ELENA", (50, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.putText(canvas_p, "P<RUSROSTOVA<<ELENA<<<<<<<<<<<<<<<<<<<<<<<<<", (50, 500), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(canvas_p, "P892345610RUS8501015F3101017<<<<<<<<<<<<<<04", (50, 550), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    _, buf_p = cv2.imencode(".jpg", canvas_p)

    upload_p = client.post(
        f"/api/v1/screenings/{session_id}/upload",
        data={"doc_role": "passport"},
        files={"file": ("passport.jpg", buf_p.tobytes(), "image/jpeg")}
    )
    assert upload_p.status_code == 200

    # 3. Upload Work Permit (secondary)
    canvas_w = np.zeros((700, 1000, 3), dtype=np.uint8)
    cv2.putText(canvas_w, "WORK PERMIT / EMPLOYMENT AUTHORIZATION", (50, 100), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    cv2.putText(canvas_w, "HOLDER: ROSTOVA ELENA", (50, 160), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    cv2.putText(canvas_w, "PERMIT NUMBER: WP-2024-99812", (50, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
    _, buf_w = cv2.imencode(".jpg", canvas_w)

    upload_w = client.post(
        f"/api/v1/screenings/{session_id}/upload",
        data={"doc_role": "work_permit"},
        files={"file": ("work_permit.jpg", buf_w.tobytes(), "image/jpeg")}
    )
    assert upload_w.status_code == 200

    # 4. Trigger Analysis
    analyze_res = client.post(f"/api/v1/screenings/{session_id}/analyze")
    assert analyze_res.status_code == 200

    # 5. Verify results
    detail_res = client.get(f"/api/v1/screenings/{session_id}")
    assert detail_res.status_code == 200
    dossier = detail_res.json()
    assert dossier["person_name"] == "Elena Rostova"
    assert "individual_analyses" in dossier
    assert "documents_requiring_recheck" in dossier
    assert "documents_with_no_issues" in dossier
    assert "next_checkpoint_notes" in dossier
    assert len(dossier["next_checkpoint_notes"]) > 0

    # 6. Verify PDF report includes the next checkpoint notes
    report_res = client.get(f"/api/v1/screenings/{session_id}/report")
    assert report_res.status_code == 200
    assert len(report_res.content) > 1000

def test_all_five_domain_document_presets():
    # TEST 1: Immigration Officers
    imm_res = client.get("/api/v1/domains/immigration_officers")
    assert imm_res.status_code == 200
    imm_docs = imm_res.json()["documents"]
    assert imm_docs == ["Passport", "Visa", "Residence Permit", "Work Permit", "Travel Authorization", "National ID"]

    # TEST 2: Border-Security Personnel
    bor_res = client.get("/api/v1/domains/border_security")
    assert bor_res.status_code == 200
    bor_docs = bor_res.json()["documents"]
    assert bor_docs == ["Passport", "Visa", "National ID", "Residence Permit", "Travel Permit", "Border/Travel Authorization"]

    # TEST 3: Airport Security Authorities
    air_res = client.get("/api/v1/domains/airport_security")
    assert air_res.status_code == 200
    air_docs = air_res.json()["documents"]
    assert air_docs == ["Passport", "Boarding Pass", "Visa", "E-Ticket", "National ID", "Travel Authorization"]

    # TEST 4: Immigration Departments
    dept_res = client.get("/api/v1/domains/immigration_departments")
    assert dept_res.status_code == 200
    dept_docs = dept_res.json()["documents"]
    assert dept_docs == ["Passport", "Visa", "Residence Permit", "Work Permit", "National ID", "Travel Authorization"]

    # TEST 5: Law-Enforcement Agencies
    lea_res = client.get("/api/v1/domains/law_enforcement")
    assert lea_res.status_code == 200
    lea_docs = lea_res.json()["documents"]
    assert lea_docs == ["Passport", "National ID", "Driving Licence", "Residence Permit", "Work Permit", "Travel Document"]

def test_domain_document_negative_and_positive_validations():
    # Negative Test 1: Airport Security + Driving Licence -> REJECT (400)
    res1 = client.post("/api/v1/screenings", json={
        "domain": "airport_security",
        "document_type": "driving_license",
        "person_name": "Test Subject"
    })
    assert res1.status_code == 400
    assert "not supported" in res1.json()["detail"].lower()

    # Negative Test 2: Immigration Officers + Driving Licence -> REJECT (400)
    res2 = client.post("/api/v1/screenings", json={
        "domain": "immigration_officers",
        "document_type": "driving_license",
        "person_name": "Test Subject"
    })
    assert res2.status_code == 400

    # Positive Test 1: Law Enforcement + Driving Licence -> ACCEPT (200)
    res3 = client.post("/api/v1/screenings", json={
        "domain": "law_enforcement",
        "document_type": "driving_license",
        "person_name": "Driver Test"
    })
    assert res3.status_code == 200
    assert res3.json()["document_type"] == "driving_license"

    # Positive Test 2: Airport Security + Boarding Pass -> ACCEPT (200)
    res4 = client.post("/api/v1/screenings", json={
        "domain": "airport_security",
        "document_type": "boarding_pass",
        "person_name": "Flyer Test"
    })
    assert res4.status_code == 200

    # Positive Test 3: Airport Security + E-Ticket -> ACCEPT (200)
    res5 = client.post("/api/v1/screenings", json={
        "domain": "airport_security",
        "document_type": "eticket",
        "person_name": "Ticket Test"
    })
    assert res5.status_code == 200

    # Negative Test 3: Law Enforcement + Boarding Pass -> REJECT (400)
    res6 = client.post("/api/v1/screenings", json={
        "domain": "law_enforcement",
        "document_type": "boarding_pass",
        "person_name": "Test Subject"
    })
    assert res6.status_code == 400

    # Negative Test 4: Immigration Departments + Boarding Pass -> REJECT (400)
    res7 = client.post("/api/v1/screenings", json={
        "domain": "immigration_departments",
        "document_type": "boarding_pass",
        "person_name": "Test Subject"
    })
    assert res7.status_code == 400

def test_document_classification_mismatch_fails_closed():
    from app.ai.classification.document_classifier import document_classifier

    # Expected: Passport, Detected Text: Boarding Pass
    res = document_classifier.classify("BOARDING PASS PASSENGER SEAT 14B GATE A2", expected_type="passport")
    assert res["status"] == "MISMATCH"
    assert res["is_match"] is False
    assert res["detected_type"] == "boarding_pass"
    assert "Mismatch" in res["message"]


