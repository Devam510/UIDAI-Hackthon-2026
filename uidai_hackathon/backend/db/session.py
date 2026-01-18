import os
import logging
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Configure logging
logger = logging.getLogger(__name__)

# ✅ Support both SQLite (local) and PostgreSQL (production)
# Read DATABASE_URL from environment variable (set by Render)
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Production: Use PostgreSQL from Render
    # Render provides postgres:// but SQLAlchemy needs postgresql://
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    logger.info("🔌 Connecting to production PostgreSQL database...")
    
    engine = create_engine(
        DATABASE_URL,
        pool_pre_ping=True,       # Verify connections before using (critical for cloud DBs)
        pool_recycle=300,         # Recycle connections every 5 minutes to avoid stale connections
        pool_size=10,             # Keep up to 10 connections open
        max_overflow=20,          # Allow up to 20 temporary extra connections
        connect_args={
            "keepalives": 1,
            "keepalives_idle": 30,
            "keepalives_interval": 10,
            "keepalives_count": 5,
        }
    )
else:
    # Local development: Use SQLite
    PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../uidai_hackathon
    DB_PATH = PROJECT_ROOT / "uidai.db"
    DATABASE_URL = f"sqlite:///{DB_PATH}"
    
    logger.info(f"📁 Connecting to local SQLite database at {DB_PATH}...")
    
    # SQLite-specific args
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """Dependency for FastAPI routes to get DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
