# FastAPI application entry point - Updated for frontend connection
from backend.config.logging import setup_logging
setup_logging()

from fastapi import FastAPI

from backend.api.ingestion import router as ingestion_router
from backend.api.analytics import router as analytics_router
from backend.api.features import router as features_router


app = FastAPI(
    title="UIDAI Trends Platform",
    description="Dynamic analytics & insights for Aadhaar enrolment",
    version="1.0"
)

# ✅ STARTUP EVENT: Initialize database (Schema Only)
@app.on_event("startup")
async def startup_event():
    """
    Initialize database schema on application startup.
    DOES NOT load data automatically. Data must be uploaded via /admin/upload-csv.
    """
    import logging
    from backend.db.base import Base
    from backend.db.session import engine
    from backend.db import models  # Register models
    
    logger = logging.getLogger(__name__)
    
    try:
        logger.info("🔧 Initializing database schema...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database schema verified/created.")
        
    except Exception as e:
        logger.error(f"❌ Error during database initialization: {e}")
        # We don't raise here to allow the app to start even if DB is briefly unreachable
        
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Request

# ✅ CORS CONFIGURATION (Strict)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://uidai-hackathon-2026-ui.onrender.com",
        "http://localhost:5173",
        "http://localhost:3000"  # Included for local dev compatibility if needed
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ✅ GLOBAL ERROR HANDLER
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    import logging
    logger = logging.getLogger("uvicorn.error")
    logger.error(f"🔥 Unhandled Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"status": "error", "message": "Internal Server Error. Please try again later."}
    )

app.include_router(ingestion_router, prefix="/ingest", tags=["Ingestion"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(features_router, prefix="/features", tags=["Features"])


@app.get("/")
def health_check():
    from backend.db.session import SessionLocal
    from sqlalchemy import text
    try:
        db = SessionLocal()
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "connected"
    except Exception:
        db_status = "error"
        
    return {
        "status": "running", 
        "service": "UIDAI Backend", 
        "database": db_status
    }

from backend.api.ml import router as ml_router
app.include_router(ml_router, prefix="/ml", tags=["ML"])

from backend.api.dashboard import router as dashboard_router
app.include_router(dashboard_router, prefix="/dashboard", tags=["Dashboard"])

from backend.api.alerts import router as alerts_router
app.include_router(alerts_router, prefix="/alerts", tags=["Alerts"])

from backend.api.meta import router as meta_router
app.include_router(meta_router, prefix="/meta", tags=["Metadata"])

from backend.api.chat import router as chat_router
app.include_router(chat_router, prefix="", tags=["Chat"])  # No prefix - /chat endpoint directly

# NEW: Export and AI Insights routers
from backend.api.export import router as export_router
app.include_router(export_router, prefix="/export", tags=["Export"])

from backend.api.ai_insights import router as ai_insights_router
app.include_router(ai_insights_router, prefix="/ai", tags=["AI Insights"])

# ✅ ADMIN: One-time CSV Upload Endpoint
from fastapi import UploadFile, File, HTTPException, BackgroundTasks
from pathlib import Path
import shutil
import tempfile
import os

@app.post("/admin/upload-csv")
async def upload_csv_data(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Admin endpoint to seed the PostgreSQL database from CSV.
    Replace existing data with fresh upload.
    """
    import logging
    from backend.ingestion.ingestion_service import ingest_uidai_source
    from backend.db.session import SessionLocal
    from backend.db import models
    from sqlalchemy import text
    
    logger = logging.getLogger(__name__)
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only .csv files are allowed")
    
    try:
        # Create a temporary file to store the upload
        suffix = Path(file.filename).suffix
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_file:
            shutil.copyfileobj(file.file, tmp_file)
            tmp_path = Path(tmp_file.name)
            
        logger.info(f"Received file: {file.filename}, saved to temp: {tmp_path}")

        def process_upload(path: Path):
            """Background task to process the file and clean up."""
            try:
                logger.info("⏳ Starting background ingestion...")
                
                # OPTIONAL: Clear existing data before load?
                # For this hackathon, let's append or upsert. 
                # But user requirement said "Replace existing data safely".
                # Let's truncate table first to ensure clean state.
                session = SessionLocal()
                try:
                    logger.info("🗑️ Clearing existing records...")
                    session.execute(text("TRUNCATE TABLE uidai_records RESTART IDENTITY;"))
                    session.commit()
                except Exception as e:
                    session.rollback()
                    logger.error(f"Failed to truncate table: {e}")
                finally:
                    session.close()

                # Process - we create a dummy directory structure because ingest_uidai_source expects a dir
                # or we verify if ingest_uidai_source handles single file.
                # Looking at ingestion_service.py, it handles directories.
                # Let's create a temp dir, move file there.
                
                upload_dir = path.parent / "uidai_upload_temp"
                upload_dir.mkdir(exist_ok=True)
                target_path = upload_dir / "aadhaar_master_monthly.csv"
                
                # Move temp file to expected name
                if target_path.exists():
                    os.remove(target_path)
                shutil.move(str(path), str(target_path))
                
                # Run ingestion
                results = ingest_uidai_source(upload_dir)
                logger.info(f"✅ Ingestion complete: {results}")
                
            except Exception as e:
                logger.error(f"❌ Ingestion failed: {e}")
            finally:
                # Cleanup
                if upload_dir.exists():
                    shutil.rmtree(upload_dir)
                if path.exists(): # Should be gone if moved, but just in case
                    os.remove(path)

        background_tasks.add_task(process_upload, tmp_path)
        
        return {
            "status": "processing",
            "message": "File received. Data ingestion started in background. Check logs for completion."
        }
        
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
