import sqlite3
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# For SQLite, check same thread
connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def ensure_schema_migrations():
    """
    Ensure newly added columns and tables exist in SQLite without dropping data.
    """
    if not settings.DATABASE_URL.startswith("sqlite"):
        return

    with engine.connect() as conn:
        # Check profiles table columns
        try:
            res = conn.execute(text("PRAGMA table_info(profiles)")).fetchall()
            existing_cols = [row[1] for row in res]
            if "organization" not in existing_cols:
                conn.execute(text("ALTER TABLE profiles ADD COLUMN organization VARCHAR(255) DEFAULT 'DocShield Security Command'"))
            if "avatar_url" not in existing_cols:
                conn.execute(text("ALTER TABLE profiles ADD COLUMN avatar_url VARCHAR(512)"))
            conn.commit()
        except Exception:
            pass

        # Check screening_sessions table columns
        try:
            res = conn.execute(text("PRAGMA table_info(screening_sessions)")).fetchall()
            existing_cols = [row[1] for row in res]
            if "person_name" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN person_name VARCHAR(255) DEFAULT 'Screening Subject'"))
            if "travel_reference" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN travel_reference JSON"))
            if "quality_result" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN quality_result JSON"))
            if "classification_result" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN classification_result JSON"))
            if "consistency_result" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN consistency_result JSON"))
            if "individual_analyses" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN individual_analyses JSON"))
            if "documents_requiring_recheck" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN documents_requiring_recheck JSON"))
            if "documents_with_no_issues" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN documents_with_no_issues JSON"))
            if "next_checkpoint_notes" not in existing_cols:
                conn.execute(text("ALTER TABLE screening_sessions ADD COLUMN next_checkpoint_notes JSON"))
            conn.commit()
        except Exception:
            pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
