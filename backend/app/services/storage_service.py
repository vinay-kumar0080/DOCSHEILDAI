import os
import uuid
import shutil
from fastapi import UploadFile, HTTPException
from app.core.config import settings

class StorageService:
    def save_upload_file(self, upload_file: UploadFile, screening_id: str) -> str:
        # Validate MIME type
        if upload_file.content_type not in settings.ALLOWED_MIME_TYPES:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file format: {upload_file.content_type}. Allowed: JPG, PNG, WEBP, PDF."
            )

        # Sanitize filename
        ext = os.path.splitext(upload_file.filename or "upload.jpg")[1].lower()
        if ext not in [".jpg", ".jpeg", ".png", ".webp", ".pdf"]:
            ext = ".jpg"

        filename = f"{screening_id}_{uuid.uuid4().hex[:8]}{ext}"
        destination = os.path.join(settings.UPLOAD_DIR, filename)

        with open(destination, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)

        # Verify size
        file_size = os.path.getsize(destination)
        if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
            os.remove(destination)
            raise HTTPException(status_code=400, detail="File exceeds maximum allowed size (15MB).")

        return destination

storage_service = StorageService()
