"""
Data loader for processed monthly Aadhaar data.
Replaces raw database queries with CSV-based loading.
Includes in-memory caching for performance.
"""
import pandas as pd
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime, timedelta

# ✅ Always resolve project root from this file location
PROJECT_ROOT = Path(__file__).resolve().parents[2]  # .../uidai_hackathon (2 levels up from backend/ml/)
PROCESSED_CSV_PATH = PROJECT_ROOT / "data" / "processed" / "aadhaar_master_monthly.csv"

# In-memory cache for CSV data
_CSV_CACHE = {
    "data": None,
    "loaded_at": None,
    "ttl_minutes": 5  # Cache expires after 5 minutes
}


def validate_monthly_data(df: pd.DataFrame) -> Dict[str, any]:
    """
    Validate processed monthly data before training.
    
    Checks:
    - No NaN values
    - No duplicate (state, district, month)
    - Non-negative numeric columns
    
    Returns validation report or raises error.
    """
    errors = []
    warnings = []
    
    # Check for NaN values
    if df.isnull().any().any():
        null_cols = df.columns[df.isnull().any()].tolist()
        errors.append(f"NaN values found in columns: {null_cols}")
    
    # Check for duplicates (warn only, will be aggregated)
    duplicates = df.duplicated(subset=['state', 'district', 'month'], keep=False)
    if duplicates.any():
        dup_count = duplicates.sum()
        warnings.append(f"Found {dup_count} duplicate (state, district, month) records - will aggregate")
    
    # Check non-negative values
    numeric_cols = ['total_enrolments', 'total_demo_updates', 'total_bio_updates']
    for col in numeric_cols:
        if (df[col] < 0).any():
            neg_count = (df[col] < 0).sum()
            errors.append(f"Found {neg_count} negative values in {col}")
    
    if errors:
        raise ValueError(f"Data validation failed:\n" + "\n".join(f"  - {e}" for e in errors))
    
    return {
        "status": "valid",
        "total_records": len(df),
        "unique_states": df['state'].nunique(),
        "unique_districts": df['district'].nunique(),
        "date_range": f"{df['month'].min()} to {df['month'].max()}",
        "warnings": warnings
    }


def load_processed_data(validate: bool = True, force_reload: bool = False) -> pd.DataFrame:
    """
    Load processed monthly Aadhaar data from CSV with caching.
    
    Args:
        validate: If True, run validation checks
        force_reload: Force reload from disk (bypass cache)
    
    Returns:
        DataFrame with columns: state, district, month, total_enrolments, 
                                total_demo_updates, total_bio_updates
    
    Cache Strategy:
        - First load: Read from CSV and cache
        - Subsequent loads: Return cached data (if < 5 minutes old)
        - After 5 minutes: Reload from CSV and update cache
    """
    global _CSV_CACHE
    
    # Check if cache is valid
    if not force_reload and _CSV_CACHE["data"] is not None and _CSV_CACHE["loaded_at"] is not None:
        cache_age = datetime.now() - _CSV_CACHE["loaded_at"]
        if cache_age < timedelta(minutes=_CSV_CACHE["ttl_minutes"]):
            # Cache is still valid
            return _CSV_CACHE["data"].copy()  # Return copy to prevent modifications
    
    # Load from CSV (cache miss or expired)
    if not PROCESSED_CSV_PATH.exists():
        raise FileNotFoundError(
            f"Processed CSV not found at: {PROCESSED_CSV_PATH}\n"
            f"Please ensure data processing has been run."
        )
    
    df = pd.read_csv(PROCESSED_CSV_PATH)
    
    # Ensure correct data types
    df['month'] = pd.to_datetime(df['month'], format='%Y-%m')
    df['total_enrolments'] = df['total_enrolments'].astype(int)
    df['total_demo_updates'] = df['total_demo_updates'].fillna(0).astype(int)
    df['total_bio_updates'] = df['total_bio_updates'].fillna(0).astype(int)
    
    # Normalize state and district names
    df['state'] = df['state'].str.strip().str.title()
    df['district'] = df['district'].str.strip().str.title()
    
    # ✅ DEDUPLICATE: Aggregate duplicate (state, district, month) records
    # This handles inconsistent district naming (e.g., "K.V.Rangareddy" vs "K.v. Rangareddy")
    df = df.groupby(['state', 'district', 'month'], as_index=False).agg({
        'total_enrolments': 'sum',
        'total_demo_updates': 'sum',
        'total_bio_updates': 'sum'
    })
    
    # Sort by date
    df = df.sort_values(['state', 'district', 'month']).reset_index(drop=True)
    
    if validate:
        validate_monthly_data(df)
    
    # Update cache
    _CSV_CACHE["data"] = df
    _CSV_CACHE["loaded_at"] = datetime.now()
    
    return df.copy()



def get_monthly_enrolment_series(state: Optional[str] = None, 
                                  district: Optional[str] = None) -> List[Dict]:
    """
    Get monthly enrolment time series for a state/district.
    
    Args:
        state: State name (optional)
        district: District name (optional)
    
    Returns:
        List of dicts with 'month' and 'total_enrolment' keys
    """
    df = load_processed_data(validate=False)
    
    # Normalize filters
    if state:
        state = " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    # Group by month and sum enrolments
    monthly = df.groupby('month')['total_enrolments'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_enrolment": int(row['total_enrolments'])}
        for _, row in monthly.iterrows()
    ]


def get_monthly_biometric_series(state: Optional[str] = None,
                                  district: Optional[str] = None) -> List[Dict]:
    """
    Get monthly biometric update time series for a state/district.
    
    Args:
        state: State name (optional)
        district: District name (optional)
    
    Returns:
        List of dicts with 'month' and 'total_biometric' keys
    """
    df = load_processed_data(validate=False)
    
    # Normalize filters
    if state:
        state = " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    # Group by month and sum biometric updates
    monthly = df.groupby('month')['total_bio_updates'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_biometric": int(row['total_bio_updates'])}
        for _, row in monthly.iterrows()
    ]


def get_monthly_demographic_series(state: Optional[str] = None,
                                    district: Optional[str] = None) -> List[Dict]:
    """
    Get monthly demographic update time series for a state/district.
    
    Args:
        state: State name (optional)
        district: District name (optional)
    
    Returns:
        List of dicts with 'month' and 'total_demographic' keys
    """
    df = load_processed_data(validate=False)
    
    # Normalize filters
    if state:
        state = " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    # Group by month and sum demographic updates
    monthly = df.groupby('month')['total_demo_updates'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_demographic": int(row['total_demo_updates'])}
        for _, row in monthly.iterrows()
    ]


def list_states() -> List[str]:
    """Get list of unique states in processed data."""
    df = load_processed_data(validate=False)
    return sorted(df['state'].unique().tolist())


def list_districts(state: str) -> List[str]:
    """Get list of unique districts for a state."""
    df = load_processed_data(validate=False)
    
    return {
        "status": "valid",
        "total_records": len(df),
        "unique_states": df['state'].nunique(),
        "unique_districts": df['district'].nunique(),
        "date_range": f"{df['month'].min()} to {df['month'].max()}",
        "warnings": warnings
    }


def load_processed_data(validate: bool = True, force_reload: bool = False) -> pd.DataFrame:
    """
    Load processed monthly Aadhaar data from CSV with caching.
    
    Args:
        validate: If True, run validation checks
        force_reload: Force reload from disk (bypass cache)
    
    Returns:
        DataFrame with columns: state, district, month, total_enrolments, 
                                total_demo_updates, total_bio_updates
    
    Cache Strategy:
        - First load: Read from CSV and cache
        - Subsequent loads: Return cached data (if < 5 minutes old)
        - After 5 minutes: Reload from CSV and update cache
    """
    global _CSV_CACHE
    
    # Check if cache is valid
    if not force_reload and _CSV_CACHE["data"] is not None and _CSV_CACHE["loaded_at"] is not None:
        cache_age = datetime.now() - _CSV_CACHE["loaded_at"]
        if cache_age < timedelta(minutes=_CSV_CACHE["ttl_minutes"]):
            # Cache is still valid
            return _CSV_CACHE["data"].copy()  # Return copy to prevent modifications
    
    # Load from CSV (cache miss or expired)
    if not PROCESSED_CSV_PATH.exists():
        raise FileNotFoundError(
            f"Processed CSV not found at: {PROCESSED_CSV_PATH}\n"
            f"Please ensure data processing has been run."
        )
    
    df = pd.read_csv(PROCESSED_CSV_PATH)
    
    # Ensure correct data types
    df['month'] = pd.to_datetime(df['month'], format='%Y-%m')
    df['total_enrolments'] = df['total_enrolments'].astype(int)
    df['total_demo_updates'] = df['total_demo_updates'].fillna(0).astype(int)
    df['total_bio_updates'] = df['total_bio_updates'].fillna(0).astype(int)
    
    # Normalize state and district names
    df['state'] = df['state'].str.strip().str.title()
    df['district'] = df['district'].str.strip().str.title()
    
    # ✅ DEDUPLICATE: Aggregate duplicate (state, district, month) records
    # This handles inconsistent district naming (e.g., "K.V.Rangareddy" vs "K.v. Rangareddy")
    df = df.groupby(['state', 'district', 'month'], as_index=False).agg({
        'total_enrolments': 'sum',
        'total_demo_updates': 'sum',
        'total_bio_updates': 'sum'
    })
    
    # Sort by date
    df = df.sort_values(['state', 'district', 'month']).reset_index(drop=True)
    
    if validate:
        validate_monthly_data(df)
    
    # Update cache
    _CSV_CACHE["data"] = df
    _CSV_CACHE["loaded_at"] = datetime.now()
    
    return df.copy()



def get_monthly_enrolment_series(state: Optional[str] = None, 
                                  district: Optional[str] = None) -> List[Dict]:
    """
    Get monthly enrolment time series for a state/district.
    
    Args:
        state: State name (optional)
        district: District name (optional)
    
    Returns:
        List of dicts with 'month' and 'total_enrolment' keys
    """
    df = load_processed_data(validate=False)
    
    # Normalize filters
    if state:
        state = " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    # Group by month and sum enrolments
    monthly = df.groupby('month')['total_enrolments'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_enrolment": int(row['total_enrolments'])}
        for _, row in monthly.iterrows()
    ]


def get_monthly_biometric_series(state: Optional[str] = None,
                                  district: Optional[str] = None) -> List[Dict]:
    """
    Get monthly biometric update time series for a state/district.
    
    Args:
        state: State name (optional)
        district: District name (optional)
    
    Returns:
        List of dicts with 'month' and 'total_biometric' keys
    """
    df = load_processed_data(validate=False)
    
    # Normalize filters
    if state:
        state = " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    # Group by month and sum biometric updates
    monthly = df.groupby('month')['total_bio_updates'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_biometric": int(row['total_bio_updates'])}
        for _, row in monthly.iterrows()
    ]


def get_monthly_demographic_series(state: Optional[str] = None,
                                    district: Optional[str] = None) -> List[Dict]:
    """
    Get monthly demographic update time series for a state/district.
    
    Args:
        state: State name (optional)
        district: District name (optional)
    
    Returns:
        List of dicts with 'month' and 'total_demographic' keys
    """
    df = load_processed_data(validate=False)
    
    # Normalize filters
    if state:
        state = " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    # Group by month and sum demographic updates
    monthly = df.groupby('month')['total_demo_updates'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_demographic": int(row['total_demo_updates'])}
        for _, row in monthly.iterrows()
    ]


def list_states() -> List[str]:
    """Get list of unique states in processed data."""
    df = load_processed_data(validate=False)
    return sorted(df['state'].unique().tolist())


def list_districts(state: str) -> List[str]:
    """Get list of unique districts for a state."""
    df = load_processed_data(validate=False)
    
    # Normalize state name
    state = " ".join(str(state).strip().split()).title()
    df = df[df['state'] == state]
    
    return sorted(df['district'].unique().tolist())


def get_last_data_date() -> str:
    """
    Get the last (most recent) date in the CSV data.
    Returns date in YYYY-MM-DD format for frontend timestamps.
    """
    df = load_processed_data(validate=False)
    if 'month' in df.columns:
        max_date = pd.to_datetime(df['month']).max()
        return max_date.strftime('%Y-%m-%d')
    return '2025-07-01'  # Fallback if no data

