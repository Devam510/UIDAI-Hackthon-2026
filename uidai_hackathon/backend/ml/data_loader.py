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

# ... imports

# ... (data_loader function)

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
    
    # ...

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
    
    # ...

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
    
    # ...

def list_districts(state: str) -> List[str]:
    """Get list of unique districts for a state."""
    df = load_processed_data(validate=False)
    
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

