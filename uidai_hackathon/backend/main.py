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

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
