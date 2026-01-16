import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ✅ Support both SQLite (local) and PostgreSQL (production)
# Read DATABASE_URL from environment variable (set by Render)
# Fall back to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production: Use PostgreSQL from Render
    # Render provides postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,  # Verify connections before using
        pool_recycle=300,    # Recycle connections every 5 minutes
    )
else:
    # Local development: Use SQLite
    PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../uidai_hackathon
    DB_PATH = PROJECT_ROOT / "uidai.db"
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

