import os
import cv2
import numpy as np
import pytest
from app.ai.face.face_engine import face_engine
from app.ai.mrz.mrz_engine import mrz_engine, MRZ_LIB_AVAILABLE
from app.ai.tampering.tampering_engine import tampering_engine

def test_yunet_and_sface_models():
    assert face_engine.loaded is True
    assert face_engine.detector is not None
    assert face_engine.recognizer is not None

    # Test on blank image: should correctly return 0 faces
    blank_img_path = "backend/app/ai/weights/test_blank.jpg"
    canvas = np.zeros((300, 300, 3), dtype=np.uint8)
    cv2.imwrite(blank_img_path, canvas)
    
    count, box, crop, raw = face_engine.detect_face(blank_img_path)
    assert count == 0
    assert box is None
    
    # Test face comparison on unreadable/blank returns proper status
    comp_res = face_engine.compare_faces(blank_img_path)
    assert comp_res["face_detected_document"] is False
    assert comp_res["status"] == "UNABLE_TO_VERIFY"
    
    if os.path.exists(blank_img_path):
        os.remove(blank_img_path)

def test_real_mrz_td3_checker():
    assert MRZ_LIB_AVAILABLE is True
    line1 = "P<USACHEN<<ALEXANDER<<<<<<<<<<<<<<<<<<<<<<<<"
    line2 = "P892345617USA9205148M3108204<<<<<<<<<<<<<<02"
    
    res = mrz_engine.parse_and_validate(f"{line1}\n{line2}")
    assert res["mrz_detected"] is True
    assert res["document_number"] == "P89234561"
    assert res["nationality"] == "USA"
    assert "checksums" in res

def test_tampering_forensics_pipeline():
    canvas = np.zeros((300, 400, 3), dtype=np.uint8)
    cv2.rectangle(canvas, (50, 50), (200, 200), (255, 255, 255), -1)
    
    test_img_path = "backend/app/ai/weights/test_tamper.jpg"
    cv2.imwrite(test_img_path, canvas)
    
    res = tampering_engine.analyze(test_img_path)
    assert "signals" in res
    assert "ela_metric" in res["signals"]
    assert "fft_high_freq_ratio" in res["signals"]
    assert "heatmap_base64" in res
    
    if os.path.exists(test_img_path):
        os.remove(test_img_path)
