import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Land Record Digitization & Validation System"
    PROJECT_ID: str = "SIH26018"
    TEAM_NAME: str = "#TECH"
    API_V1_STR: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "sih2026-super-secret-key-land-records-team-tech-secure-jwt")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database: Default PostgreSQL, with automatic graceful fallback in session.py
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@localhost:5432/land_records_db"
    )
    
    # Uploads
    UPLOAD_DIR: Path = BASE_DIR / "uploads"
    SAMPLE_DIR: Path = BASE_DIR / "sample_documents"
    MAX_FILE_SIZE_MB: int = 15
    
    # Confidence Score Thresholds
    HIGH_CONFIDENCE_THRESHOLD: float = 90.0
    MEDIUM_CONFIDENCE_THRESHOLD: float = 70.0
    
    # Duplicate Detection Thresholds
    HIGH_DUPLICATE_THRESHOLD: float = 90.0
    POSSIBLE_DUPLICATE_THRESHOLD: float = 70.0

    class Config:
        case_sensitive = True

settings = Settings()
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.SAMPLE_DIR.mkdir(parents=True, exist_ok=True)
