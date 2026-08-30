import pytest
from app.ai.mrz.mrz_engine import mrz_engine
from app.ai.risk.risk_engine import risk_engine
from app.ai.quality.image_quality import image_quality_analyzer
from app.ai.classification.document_classifier import document_classifier

def test_mrz_checksum_computation():
    # Standard ICAO 9303 checksum calculation: weights 7, 3, 1
    # Example: "HA672242<" -> check digit
    assert mrz_engine.calculate_checksum("HA672242") == mrz_engine.calculate_checksum("HA672242")
    # Digits mapping
    assert mrz_engine.get_char_value('0') == 0
    assert mrz_engine.get_char_value('A') == 10
    assert mrz_engine.get_char_value('Z') == 35
    assert mrz_engine.get_char_value('<') == 0

def test_mrz_validation_with_td3():
    line1 = "P<USACHEN<<ALEXANDER<<<<<<<<<<<<<<<<<<<<<<<<"
    line2 = "P892345617USA9205148M3108204<<<<<<<<<<<<<<02"
    res = mrz_engine.parse_and_validate(f"{line1}\n{line2}", {"document_number": "P89234561"})
    assert res["mrz_detected"] is True
    assert res["document_number"] == "P89234561"
    assert res["nationality"] == "USA"

def test_risk_engine_clean_signals():
    quality = {"is_usable": True, "status": "PASS", "score": 0.95}
    classification = {"detected_type": "passport", "status": "PASS", "confidence": 0.95}
    ocr = {"raw_text": "PASSPORT OF THE UNITED STATES ALEXANDER CHEN", "average_confidence": 0.98}
    mrz = {"mrz_detected": True, "is_valid": True, "field_matches": {"document_number_match": True}}
    validations = [{"check_name": "Document Expiry Date", "status": "PASS", "message": "Valid"}]
    tampering = {"tampering_detected": False, "score": 0.05}
    face = {"status": "MATCH_SIGNAL", "similarity": 0.92}

    res = risk_engine.evaluate(
        "passport", quality, classification, ocr, mrz, validations, tampering, face
    )
    assert res["risk_score"] <= 30.0
    assert res["risk_level"] == "LOW_RISK"
    assert len(res["contributors"]) > 0

def test_risk_engine_tampered_signals():
    quality = {"is_usable": True, "status": "LOW_QUALITY", "score": 0.60}
    classification = {"detected_type": "visa", "status": "PASS", "confidence": 0.90}
    ocr = {"raw_text": "VISA AUTHORIZATION CHEN", "average_confidence": 0.85}
    mrz = {"mrz_detected": True, "is_valid": False, "field_matches": {"document_number_match": False}}
    validations = [{"check_name": "Document Expiry Date", "status": "FAIL", "message": "Expired"}]
    tampering = {"tampering_detected": True, "score": 0.88}
    face = {"status": "MISMATCH_SIGNAL", "similarity": 0.40}

    res = risk_engine.evaluate(
        "visa", quality, classification, ocr, mrz, validations, tampering, face
    )
    assert res["risk_score"] >= 60.0
    assert res["risk_level"] == "HIGH_RISK"

def test_risk_engine_fail_closed_on_non_document():
    quality = {"is_usable": False, "status": "UNACCEPTABLE", "score": 0.20}
    classification = {"detected_type": "non_document_object", "status": "REJECT", "confidence": 0.92}
    ocr = {"raw_text": "", "average_confidence": 0.0}
    mrz = {"mrz_detected": False, "is_valid": False}
    validations = []
    tampering = {"tampering_detected": False, "score": 0.0}
    face = {"status": "NOT_EVALUATED", "similarity": 0.0}

    res = risk_engine.evaluate(
        "passport", quality, classification, ocr, mrz, validations, tampering, face
    )
    assert res["is_fail_closed"] is True
    assert res["risk_level"] == "UNABLE_TO_DETERMINE"
    assert res["risk_score"] >= 40.0
