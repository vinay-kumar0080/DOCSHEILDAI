import os
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.ai.face.face_engine import face_engine
from app.services.storage_service import storage_service

router = APIRouter(tags=["Biometrics & Face Verification"])

@router.post("/face-verification")
def verify_faces_direct(
    document_photo: UploadFile = File(...),
    live_selfie: UploadFile = File(...)
):
    """
    Direct 1:1 facial biometric matching between document portrait and live camera photo.
    """
    temp_screening_id = "direct_face_match"
    doc_path = storage_service.save_upload_file(document_photo, temp_screening_id)
    live_path = storage_service.save_upload_file(live_selfie, temp_screening_id)

    try:
        res = face_engine.compare_faces(doc_path, live_path)
        return res
    finally:
        # Cleanup temporary files
        if os.path.exists(doc_path):
            os.remove(doc_path)
        if os.path.exists(live_path):
            os.remove(live_path)
