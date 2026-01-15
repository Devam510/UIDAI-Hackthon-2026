# Ingestion API routes
from fastapi import APIRouter
from pathlib import Path

from backend.ingestion.ingestion_service import ingest_uidai_source

router = APIRouter()


@router.post("/folder")
def ingest_folder(path: str):
    """
    Ingest already-unzipped UIDAI data folder
    """
    source_path = Path(path)

    results = ingest_uidai_source(source_path)
    return {
        "status": "success",
        "files_processed": results
    }
