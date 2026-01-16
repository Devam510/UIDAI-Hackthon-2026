from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# ✅ Always point to project root / uidai.db
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../uidai_hackathon
DB_PATH = PROJECT_ROOT / "uidai.db"

DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
