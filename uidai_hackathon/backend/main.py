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

# ✅ STARTUP EVENT: Initialize database and load data
@app.on_event("startup")
async def startup_event():
    """
    Initialize database and load CSV data on application startup.
    This ensures the database exists before any API requests are processed.
    Critical for Render deployment where database doesn't persist between builds.
    """
    import logging
    from pathlib import Path
    from backend.db.base import Base
    from backend.db.session import engine, SessionLocal
    from backend.db import models  # Import models to register them with Base
    from backend.ingestion.ingestion_service import ingest_uidai_source
    
    logger = logging.getLogger(__name__)
    
    try:
        # Step 1: Create all database tables
        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Step 2: Check if database already has data
        session = SessionLocal()
        record_count = session.query(models.UIDAIRecord).count()
        session.close()
        
        if record_count > 0:
            logger.info(f"✅ Database already contains {record_count} records. Skipping data load.")
            return
        
        # Step 3: Load data from CSV if database is empty
        logger.info("Database is empty. Attempting to load data from CSV...")
        
        # Find the CSV file
        project_root = Path(__file__).resolve().parents[1]  # uidai_hackathon folder
        csv_path = project_root / "data" / "processed" / "aadhaar_master_monthly.csv"
        
        if not csv_path.exists():
            logger.warning("=" * 80)
            logger.warning("⚠️  CSV FILE NOT FOUND - DATABASE IS EMPTY")
            logger.warning("=" * 80)
            logger.warning(f"Expected CSV location: {csv_path}")
            logger.warning("")
            logger.warning("The database is empty and needs to be seeded with data.")
            logger.warning("To upload data, use the /admin/upload-csv endpoint:")
            logger.warning("")
            logger.warning("  curl -X POST -F \"file=@aadhaar_master_monthly.csv\" \\")
            logger.warning("    https://your-app.onrender.com/admin/upload-csv")
            logger.warning("")
            logger.warning("After uploading once, the PostgreSQL database will persist the data.")
            logger.warning("You will NOT need to upload again on subsequent restarts.")
            logger.warning("=" * 80)
            return
        
        # Ingest the CSV data
        logger.info(f"Loading data from {csv_path}...")
        results = ingest_uidai_source(csv_path.parent)  # Pass the directory
        
        logger.info(f"✅ Data loaded successfully: {results}")
        
        # Verify data was loaded
        session = SessionLocal()
        final_count = session.query(models.UIDAIRecord).count()
        session.close()
        
        logger.info(f"✅ Database now contains {final_count} records")
        
    except Exception as e:
        logger.error(f"❌ Error during startup initialization: {e}")
        logger.exception("Full traceback:")
        # Don't raise - let the app start anyway, but log the error

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

app.include_router(ingestion_router, prefix="/ingest", tags=["Ingestion"])
app.include_router(analytics_router, prefix="/analytics", tags=["Analytics"])
app.include_router(features_router, prefix="/features", tags=["Features"])


@app.get("/")
def health_check():
    return {"status": "running", "service": "UIDAI Backend"}

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

# ✅ TEMPORARY: CSV Upload Endpoint for Render Free Tier
# Use this to upload CSV file since shell access is not available in free tier
from fastapi import UploadFile, File, HTTPException
from pathlib import Path
import shutil

@app.post("/admin/upload-csv")
async def upload_csv_data(file: UploadFile = File(...)):
    """
    Temporary endpoint to upload CSV data to Render.
    Use this once after deployment to upload aadhaar_master_monthly.csv
    
    Usage:
    curl -X POST -F "file=@aadhaar_master_monthly.csv" https://your-app.onrender.com/admin/upload-csv
    """
    import logging
    from backend.ingestion.ingestion_service import ingest_uidai_source
    from backend.db import models
    from backend.db.session import SessionLocal
    
    logger = logging.getLogger(__name__)
    
    try:
        # Save uploaded file
        project_root = Path(__file__).resolve().parents[1]
        csv_dir = project_root / "data" / "processed"
        csv_dir.mkdir(parents=True, exist_ok=True)
        csv_path = csv_dir / "aadhaar_master_monthly.csv"
        
        logger.info(f"Saving uploaded CSV to {csv_path}")
        
        with open(csv_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info("✅ CSV file saved successfully")
        
        # Check if data already exists
        session = SessionLocal()
        record_count = session.query(models.UIDAIRecord).count()
        session.close()
        
        if record_count > 0:
            return {
                "status": "success",
                "message": f"CSV uploaded but data already exists ({record_count} records). Skipping ingestion.",
                "csv_path": str(csv_path)
            }
        
        # Ingest the data
        logger.info("Starting data ingestion...")
        results = ingest_uidai_source(csv_dir)
        
        # Verify
        session = SessionLocal()
        final_count = session.query(models.UIDAIRecord).count()
        session.close()
        
        logger.info(f"✅ Data ingestion complete. {final_count} records in database")
        
        return {
            "status": "success",
            "message": "CSV uploaded and data ingested successfully",
            "csv_path": str(csv_path),
            "records_loaded": final_count,
            "ingestion_results": results
        }
        
    except Exception as e:
        logger.error(f"❌ Error uploading CSV: {e}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=500, detail=f"Failed to upload CSV: {str(e)}")
