import os
import sys
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Add backend directory to sys.path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.config import settings
from app.db.database import engine, Base, ensure_schema_migrations
from app.api.routes import (
    auth, domains, screenings, analysis, reports, face, analytics, health,
    notifications, settings as settings_route
)
try:
    from database.seed.seed_data import seed_database
except ImportError:
    import sys
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
    try:
        from database.seed.seed_data import seed_database
    except ImportError:
        def seed_database(): pass

# Create tables and run safe column migrations
Base.metadata.create_all(bind=engine)
ensure_schema_migrations()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Based Fake Identity & Document Screening System API",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount local storage for reports and heatmaps
app.mount("/storage", StaticFiles(directory="storage"), name="storage")

# Include Routers
app.include_router(health.router, prefix=settings.API_V1_STR)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(domains.router, prefix=settings.API_V1_STR)
app.include_router(screenings.router, prefix=settings.API_V1_STR)
app.include_router(analysis.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(face.router, prefix=settings.API_V1_STR)
app.include_router(notifications.router, prefix=settings.API_V1_STR)
app.include_router(settings_route.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)

@app.on_event("startup")
def on_startup():
    # Automatically seed synthetic sample records if database is empty
    try:
        seed_database()
    except Exception as e:
        print(f"Seed note: {e}")

@app.get("/")
def root():
    return {
        "message": "DocShield AI Screening Engine Operational",
        "api_docs": "/docs",
        "version": settings.VERSION
    }
