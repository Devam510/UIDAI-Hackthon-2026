from pathlib import Path
import pandas as pd

from backend.validation.normalizer import normalize_columns
from backend.validation.schema_detector import detect_dataset_type
from backend.validation.validator import validate_dataset

# ✅ Always resolve project root from this file location
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../uidai_hackathon
DATA_DIR = PROJECT_ROOT / "data" / "raw" / "api_data_aadhar_enrolment"

csv_files = list(DATA_DIR.glob("*.csv"))
if not csv_files:
    raise FileNotFoundError(f"No CSV files found in {DATA_DIR}")

df = pd.read_csv(csv_files[0])   # load first available file

df = normalize_columns(df)
dtype = detect_dataset_type(df)
df = validate_dataset(df, dtype)

print("Dataset type:", dtype)
print("Rows:", len(df))
print("Loaded file:", csv_files[0].name)
