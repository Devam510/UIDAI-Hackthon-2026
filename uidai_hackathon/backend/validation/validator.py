# Validation module
import pandas as pd
from .data_contract import DATASET_CONTRACT

def validate_dataset(df, dataset_type):
    rules = DATASET_CONTRACT[dataset_type]

    # Required columns
    missing = rules["required_columns"] - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    # Date parsing
    for col in rules["date_columns"]:
        df[col] = pd.to_datetime(
    df[col],
    errors="coerce",
    dayfirst=True
)


    if df[col].isna().all():
        raise ValueError("Date column parsing failed")

    # Metric columns validation
    metric_cols = [
        c for c in df.columns
        if any(c.startswith(p) for p in rules["metric_prefixes"])
    ]

    if not metric_cols:
        raise ValueError("No metric columns detected")

    for col in metric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0)

    return df
