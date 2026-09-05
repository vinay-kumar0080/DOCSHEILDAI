import os
import cv2
import numpy as np
import pytest
from app.ai.ocr.ocr_engine import ocr_engine
from app.ai.mrz.mrz_engine import mrz_engine
from app.ai.quality.image_quality import image_quality_analyzer
from app.ai.tampering.tampering_engine import tampering_engine
from app.ai.face.face_engine import face_engine
from app.ai.risk.risk_engine import risk_engine
from mrz.generator.td3 import TD3CodeGenerator

@pytest.fixture
def synthetic_passport_image(tmp_path):
    img_path = str(tmp_path / "synthetic_passport.png")
    img = np.ones((600, 900, 3), dtype=np.uint8) * 245
    # Text headers and fields
    cv2.putText(img, 'PASSPORT', (50, 70), cv2.FONT_HERSHEY_SIMPLEX, 1.2, (10, 10, 80), 3)
    cv2.putText(img, 'UNITED STATES OF AMERICA', (50, 120), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (20, 20, 20), 2)
    cv2.putText(img, 'SURNAME: DOE', (50, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(img, 'GIVEN NAMES: JOHN', (50, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(img, 'NATIONALITY: USA', (50, 260), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(img, 'PASSPORT NO: A12345678', (50, 300), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.putText(img, 'EXPIRY DATE: 2030-05-15', (50, 340), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (30, 30, 30), 2)
    cv2.imwrite(img_path, img)
    return img_path

@pytest.fixture
def blank_image(tmp_path):
    img_path = str(tmp_path / "blank_textureless.png")
    img = np.ones((400, 600, 3), dtype=np.uint8) * 128
    cv2.imwrite(img_path, img)
    return img_path

def test_ocr_high_quality_synthetic_document(synthetic_passport_image):
    """Test A: High-quality synthetic document produces useful OCR text and metrics."""
    res = ocr_engine.extract_text_and_fields(synthetic_passport_image, "passport")
    assert res["status"] == "COMPLETED"
    assert len(res["raw_text"]) > 10
    assert "average_confidence" in res
    assert "detection_confidence" in res
    assert "recognition_confidence" in res
    assert "quality_score" in res
    assert res["average_confidence"] > 0.40
    assert res["detection_confidence"] > 0.50

def test_ocr_poor_blank_image_fails_closed(blank_image):
    """Test C: Poor / blank image produces no fabricated structured fields and zero/low confidence."""
    res = ocr_engine.extract_text_and_fields(blank_image, "passport")
    assert res["structured_fields"] == {}
    assert res["average_confidence"] == 0.0

def test_mrz_clear_synthetic_valid_td3():
    """Test B: Clear synthetic MRZ produces valid checksums and correct fields."""
    gen = TD3CodeGenerator("P", "USA", "DOE", "JOHN", "A12345678", "USA", "900101", "M", "300515")
    mrz_text = str(gen)
    res = mrz_engine.parse_and_validate(mrz_text)
    
    assert res["mrz_detected"] is True
    assert res["is_valid"] is True
    assert res["document_number"] == "A12345678"
    assert res["nationality"] == "USA"
    assert res["issuer"] == "USA"
    assert res["date_of_birth"] == "1990-01-01"
    assert res["expiry_date"] == "2030-05-15"
    assert res["checksums"]["document_number"] is True
    assert res["checksums"]["date_of_birth"] is True
    assert res["checksums"]["expiry_date"] is True
    assert res["checksums"]["composite"] is True
    assert res["confidence"] >= 0.95

def test_mrz_invalid_checksum_rejected():
    """Test D: Invalid MRZ check digit causes is_valid=False and low confidence."""
    # Corrupted check digit for document number (using 9 instead of 4)
    l1 = "P<USADOE<<JOHN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<"
    l2 = "A123456789USA9001011M3005154<<<<<<<<<<<<<<06"
    mrz_text = f"{l1}\n{l2}"
    
    res = mrz_engine.parse_and_validate(mrz_text)
    assert res["mrz_detected"] is True
    assert res["checksums"]["document_number"] is False
    assert res["is_valid"] is False

def test_mrz_blank_image_returns_no_detection(blank_image):
    """Test that blank image returns mrz_detected=False without fabricated values."""
    res = mrz_engine.detect_and_validate(image_path=blank_image, raw_text="")
    assert res["mrz_detected"] is False
    assert res["mrz_text"] is None
    assert res["is_valid"] is False
    assert res["confidence"] == 0.0

def test_tampering_engine_functional(synthetic_passport_image):
    """Test E: Tampering analysis engine remains functional."""
    res = tampering_engine.analyze(synthetic_passport_image, is_tampered_simulation=False)
    assert "tampering_detected" in res
    assert "score" in res
    assert "confidence" in res
    assert "status" in res

def test_face_engine_functional(synthetic_passport_image):
    """Test F: Face detection engine remains functional."""
    res = face_engine.detect_faces(synthetic_passport_image)
    assert "face_detected" in res
    assert "face_count" in res
    assert "status" in res

def test_image_quality_sharp_image_not_unconditionally_failed(synthetic_passport_image):
    """Test Image Quality: Sharp document (600x900) is marked USABLE."""
    qual = image_quality_analyzer.analyze(synthetic_passport_image)
    assert qual["is_usable"] is True
    assert qual["status"] in ["PASS", "LOW_QUALITY"]
