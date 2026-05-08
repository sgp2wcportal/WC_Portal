import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./society.db"
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    UPLOAD_FOLDER: str = "../storage"
    BACKUP_FOLDER: str = "../backup"
    DEBUG: bool = True

    # Committee UPI details (shown to users on the booking page)
    COMMITTEE_UPI_ID: str = "siddhagalaxia@upi"
    COMMITTEE_UPI_NAME: str = "Siddha Galaxia Welfare Committee"

    # Outgoing mail. Leave SMTP_HOST empty to fall back to disk delivery
    # (each mail is written to ../storage/emails/<id>/ for inspection).
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM: str = ""
    SMTP_TLS: bool = True

    class Config:
        env_file = ".env"

settings = Settings()
