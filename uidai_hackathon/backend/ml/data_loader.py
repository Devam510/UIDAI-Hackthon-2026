"""
Data loader for processed monthly Aadhaar data.
Replaces CSV reading with PostgreSQL database query.
"Zero File Dependency" version for Render.
"""
import pandas as pd
import logging
from pathlib import Path
from typing import Optional, List, Dict
from datetime import datetime, timedelta

from backend.db.session import SessionLocal, engine
from backend.db.models import UIDAIRecord

logger = logging.getLogger(__name__)

# In-memory cache to reduce DB hits
_DB_CACHE = {
    "data": None,
    "loaded_at": None,
    "ttl_minutes": 5  # Cache expires after 5 minutes
}

def load_processed_data(validate: bool = True, force_reload: bool = False) -> pd.DataFrame:
    """
    Load data from PostgreSQL database and pivot to expected format.
    
    Args:
        validate: If True, run validation checks (kept for compatibility)
        force_reload: Force reload from DB (bypass cache)
    
    Returns:
        DataFrame with columns: state, district, month, total_enrolments, 
                                total_demo_updates, total_bio_updates
    """
    global _DB_CACHE
    
    # Check cache
    if not force_reload and _DB_CACHE["data"] is not None and _DB_CACHE["loaded_at"] is not None:
        cache_age = datetime.now() - _DB_CACHE["loaded_at"]
        if cache_age < timedelta(minutes=_DB_CACHE["ttl_minutes"]):
            return _DB_CACHE["data"].copy()
    
    logger.info("📡 Fetching data from PostgreSQL database...")
    
    try:
        # SQL Query to fetch data
        # We fetch raw records: date, state, district, metric_name, metric_value
        query = "SELECT date as month, state, district, metric_name, metric_value FROM uidai_records"
        
        # Use pandas read_sql with the engine
        df_long = pd.read_sql(query, engine)
        
        if df_long.empty:
            logger.warning("⚠️ Database return empty DataFrame! Database might be empty.")
            # Return empty DataFrame with expected columns to prevent crashes
            return pd.DataFrame(columns=[
                "state", "district", "month", 
                "total_enrolments", "total_demo_updates", "total_bio_updates"
            ])

        # Convert date to datetime
        df_long['month'] = pd.to_datetime(df_long['month'])
        
        # Pivot the table: Long -> Wide
        # Index: month, state, district
        # Columns: metric_name
        # Values: metric_value
        df_wide = df_long.pivot_table(
            index=['state', 'district', 'month'], 
            columns='metric_name', 
            values='metric_value', 
            aggfunc='sum',
            fill_value=0
        ).reset_index()
        
        # Ensure we have all expected columns
        expected_cols = ["total_enrolments", "total_demo_updates", "total_bio_updates"]
        for col in expected_cols:
            if col not in df_wide.columns:
                df_wide[col] = 0
                
        # Rename columns to match exact expected schema if needed (pivot uses metric names as cols)
        # Ensure types
        df_wide['total_enrolments'] = df_wide['total_enrolments'].astype(int)
        df_wide['total_demo_updates'] = df_wide['total_demo_updates'].astype(int)
        df_wide['total_bio_updates'] = df_wide['total_bio_updates'].astype(int)
        
        # Normalize exact format as original (sort by state, district, month)
        df_wide = df_wide.sort_values(['state', 'district', 'month']).reset_index(drop=True)
        
        logger.info(f"✅ Loaded {len(df_wide)} rows from database.")
        
        # Update cache
        _DB_CACHE["data"] = df_wide
        _DB_CACHE["loaded_at"] = datetime.now()
        
        return df_wide.copy()

    except Exception as e:
        logger.error(f"❌ Failed to load data from database: {e}")
        # Return empty DF on error to avoid critical crash
        return pd.DataFrame(columns=[
            "state", "district", "month", 
            "total_enrolments", "total_demo_updates", "total_bio_updates"
        ])


def get_monthly_enrolment_series(state: Optional[str] = None, 
                                  district: Optional[str] = None) -> List[Dict]:
    """Get monthly enrolment time series for a state/district."""
    df = load_processed_data(validate=False)
    
    if df.empty:
        return []

    # Normalize filters
    if state:
        from backend.common.state_resolver import normalize_state_name
        normalized = normalize_state_name(state)
        state_filter = normalized if normalized else " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state_filter]
    
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
    """Get monthly biometric update time series for a state/district."""
    df = load_processed_data(validate=False)
    
    if df.empty:
        return []
        
    if state:
        from backend.common.state_resolver import normalize_state_name
        normalized = normalize_state_name(state)
        state_filter = normalized if normalized else " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state_filter]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    monthly = df.groupby('month')['total_bio_updates'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_biometric": int(row['total_bio_updates'])}
        for _, row in monthly.iterrows()
    ]


def get_monthly_demographic_series(state: Optional[str] = None,
                                    district: Optional[str] = None) -> List[Dict]:
    """Get monthly demographic update time series for a state/district."""
    df = load_processed_data(validate=False)
    
    if df.empty:
        return []

    if state:
        from backend.common.state_resolver import normalize_state_name
        normalized = normalize_state_name(state)
        state_filter = normalized if normalized else " ".join(str(state).strip().split()).title()
        df = df[df['state'] == state_filter]
    
    if district:
        district = " ".join(str(district).strip().split()).title()
        df = df[df['district'] == district]
    
    if df.empty:
        return []
    
    monthly = df.groupby('month')['total_demo_updates'].sum().reset_index()
    monthly = monthly.sort_values('month')
    
    return [
        {"month": row['month'], "total_demographic": int(row['total_demo_updates'])}
        for _, row in monthly.iterrows()
    ]


def list_states() -> List[str]:
    """Get list of unique states in processed data."""
    df = load_processed_data(validate=False)
    if df.empty:
        return []
    return sorted(df['state'].unique().tolist())


def list_districts(state: str) -> List[str]:
    """Get list of unique districts for a state."""
    df = load_processed_data(validate=False)
    
    from backend.common.state_resolver import normalize_state_name
    normalized = normalize_state_name(state)
    state_filter = normalized if normalized else " ".join(str(state).strip().split()).title()
    df = df[df['state'] == state_filter]
    
    return sorted(df['district'].unique().tolist())


def get_last_data_date() -> str:
    """Get the last (most recent) date in the data."""
    df = load_processed_data(validate=False)
    if not df.empty and 'month' in df.columns:
        max_date = pd.to_datetime(df['month']).max()
        return max_date.strftime('%Y-%m-%d')
    return datetime.now().strftime('%Y-%m-%d')
