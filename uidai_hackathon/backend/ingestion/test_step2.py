from pathlib import Path
from backend.ingestion.ingestion_service import ingest_uidai_source

# ✅ Always resolve project root from this file location
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../uidai_hackathon
data_folder = PROJECT_ROOT / "data" / "raw" / "api_data_aadhar_enrolment"

results = ingest_uidai_source(data_folder)

for r in results:
    print(r)
