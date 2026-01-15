from pathlib import Path

from backend.ingestion.zip_handler import extract_zip
from backend.ingestion.csv_loader import load_all_csvs

from backend.validation.normalizer import normalize_columns
from backend.validation.schema_detector import detect_dataset_type
from backend.validation.validator import validate_dataset

from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord

# ✅ Always resolve project root from this file location
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../uidai_hackathon


def save_to_db(df, dataset_type, source_file, batch_size: int = 20000):
    """
    Fast bulk insert.
    Converts wide CSV -> long table (metric_name, metric_value)
    Inserts in batches for speed.
    """

    session = SessionLocal()

    metric_cols = [
        c for c in df.columns
        if c not in {"date", "state", "district", "pincode"}
        and not c.startswith("__")
    ]

    mappings = []
    inserted = 0

    for _, row in df.iterrows():
        date_value = row["date"]
        if hasattr(date_value, "date"):
            date_value = date_value.date()

        base = {
            "dataset_type": dataset_type,
            "date": date_value,
            "state": " ".join(str(row["state"]).strip().split()).title(),
            "district": " ".join(str(row["district"]).strip().split()).title(),
            "pincode": str(row["pincode"]).strip(),
            "source_file": source_file
        }

        for metric in metric_cols:
            mappings.append({
                **base,
                "metric_name": metric,
                "metric_value": int(row[metric])
            })

            # ✅ bulk insert when batch is full
            if len(mappings) >= batch_size:
                session.bulk_insert_mappings(UIDAIRecord, mappings)
                session.commit()
                inserted += len(mappings)
                mappings = []

    # insert leftover
    if mappings:
        session.bulk_insert_mappings(UIDAIRecord, mappings)
        session.commit()
        inserted += len(mappings)

    session.close()
    return inserted




def ingest_uidai_source(source_path: Path):
    if not source_path.exists():
        raise FileNotFoundError(f"{source_path} not found")

    # Case 1: ZIP file
    if source_path.suffix == ".zip":
        extract_dir = PROJECT_ROOT / "data" / "processed" / source_path.stem
        extract_zip(source_path, extract_dir)
        data_dir = extract_dir

    # Case 2: Already extracted folder
    elif source_path.is_dir():
        data_dir = source_path

    else:
        raise ValueError("Source must be a ZIP file or a directory")

    results = []

    for filename, df in load_all_csvs(data_dir):
        df = normalize_columns(df)

        dataset_type = detect_dataset_type(df)
        df = validate_dataset(df, dataset_type)

        results.append({
            "file": filename,
            "dataset_type": dataset_type,
            "rows": len(df)
        
        })
        save_to_db(df, dataset_type, filename)


    return results
