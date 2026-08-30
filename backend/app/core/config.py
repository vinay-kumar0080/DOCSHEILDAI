import os
from typing import List

try:
    from pydantic_settings import BaseSettings
except ImportError:
    class BaseSettings:
        pass

class Settings(BaseSettings):
    PROJECT_NAME: str = "DocShield AI"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Environment
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./docshield.db")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    
    # Storage & Retention
    UPLOAD_DIR: str = os.getenv("UPLOAD_DIR", "./storage/uploads")
    REPORT_DIR: str = os.getenv("REPORT_DIR", "./storage/reports")
    HEATMAP_DIR: str = os.getenv("HEATMAP_DIR", "./storage/heatmaps")
    DOCUMENT_RETENTION_HOURS: int = int(os.getenv("DOCUMENT_RETENTION_HOURS", "24"))
    
    # Maximum Upload Size (15 MB)
    MAX_UPLOAD_SIZE_BYTES: int = 15 * 1024 * 1024
    ALLOWED_MIME_TYPES: List[str] = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf"
    ]
    
    # Risk Engine Weights
    WEIGHT_TAMPERING: float = 30.0
    WEIGHT_MRZ_FAILURE: float = 25.0
    WEIGHT_FIELD_MISMATCH: float = 20.0
    WEIGHT_FACE_MISMATCH: float = 25.0
    WEIGHT_EXPIRED_DOC: float = 15.0
    WEIGHT_POOR_QUALITY: float = 10.0
    WEIGHT_CLASSIFICATION_LOW_CONF: float = 10.0

    # Risk Thresholds
    RISK_THRESHOLD_LOW: int = 30
    RISK_THRESHOLD_REVIEW: int = 60

settings = Settings()

os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.REPORT_DIR, exist_ok=True)
os.makedirs(settings.HEATMAP_DIR, exist_ok=True)
