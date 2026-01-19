"""
Biometric district risk scoring using ML models and monthly CSV data.
SINGLE SOURCE: aadhaar_master_monthly.csv → ML Model → Risk Score
"""
import numpy as np
import pandas as pd
from typing import Dict, List

from backend.common.state_resolver import resolve_state
from backend.common.key_utils import slugify_key
from backend.ml.registry import load_model
from backend.ml.data_loader import get_monthly_biometric_series


def compute_biometric_district_risk(state: str, district: str) -> Dict:
    """
    Compute ML-based biometric risk using monthly CSV data.
    
    Args:
        state: State name
        district: District name
    
    Returns:
        Dict with biometric risk score and all frontend-required fields
    """
    state = resolve_state(state)
    
    # Load monthly biometric series from CSV
    series = get_monthly_biometric_series(state=state, district=district)
    
    if not series or len(series) < 3:
        return {
            "status": "skipped",
            "reason": f"Insufficient biometric data: {len(series) if series else 0} months"
        }
    
    # Convert to DataFrame
    df = pd.DataFrame(series)
    if df.empty:
        return {"status": "skipped", "reason": "Empty biometric data"}
    
    # Ensure month column is datetime
    df["month"] = pd.to_datetime(df["month"], errors="coerce")
    df = df.dropna(subset=["month"]).sort_values("month")
    
    if len(df) < 3:
        return {"status": "skipped", "reason": f"Insufficient data after cleaning: {len(df)} months"}
    
    # Build features for monthly data
    df = _build_monthly_biometric_features(df).dropna()
    
    if len(df) < 2:
        return {"status": "skipped", "reason": "Insufficient data after feature engineering"}
    
    # Load ML model
    key = slugify_key(state)
    baseline = None
    model_key_used = None
    
    # Try multiple model keys with fallback
    for model_key in [f"bio_expected_{key}", f"bio_expected_{state}", "bio_expected_global"]:
        baseline = load_model(model_key)
        if baseline is not None:
            model_key_used = model_key
            break
    
    if baseline is None:
        return {"status": "skipped", "reason": "Biometric baseline model missing"}
    
    # Prepare features for prediction
    feature_cols = ["month_num", "lag_1", "lag_2", "roll_3"]
    
    # Check if model expects different features (daily vs monthly)
    if hasattr(baseline, 'feature_names_in_'):
        model_features = baseline.feature_names_in_
        if 'dayofweek' in model_features:
            # Model expects daily features, add dummy values
            df['dayofweek'] = 0
            df['day'] = 15
            feature_cols = ["dayofweek", "month_num", "day", "lag_1", "lag_2", "roll_3"]
    
    X = df[feature_cols]
    
    # ML model prediction
    df["bio_expected"] = baseline.predict(X)
    df["bio_gap"] = df["total_biometric"] - df["bio_expected"]
    
    # Calculate risk components from last 30 days (or all available months)
    last_n = df.tail(min(30, len(df)))
    gap_abs_mean = float(last_n["bio_gap"].abs().mean())
    neg_ratio = float((last_n["bio_gap"] < 0).mean())
    gap_trend = float(last_n["bio_gap"].diff().mean()) if len(last_n) > 1 else 0.0
    
    # ML risk formula
    raw_risk = np.log1p(gap_abs_mean) + (neg_ratio * 10) + (abs(gap_trend) / 1000)
    
    # Get trend data (all available months, padded to 30 values)
    trend_data = df["total_biometric"].tolist()
    if len(trend_data) > 30:
        trend_data = trend_data[-30:]
    elif len(trend_data) < 30:
        # Pad by repeating values
        days_per_month = 30 // len(trend_data)
        remainder = 30 % len(trend_data)
        daily_trend = []
        for i, monthly_val in enumerate(trend_data):
            days_for_this_month = days_per_month + (1 if i < remainder else 0)
            daily_trend.extend([monthly_val] * days_for_this_month)
        trend_data = daily_trend[:30]
    
    return {
        "status": "success",
        "state": state,
        "district": district,
        "raw_risk": float(raw_risk),
        "components": {
            "bio_gap_abs_mean_30": float(gap_abs_mean),
            "bio_negative_gap_ratio_30": float(neg_ratio),
            "bio_gap_trend": float(gap_trend)
        },
        "points_used": len(df),
        "trend_data": [float(x) for x in trend_data],
        "model_key_used": model_key_used
    }


def _build_monthly_biometric_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Build features for monthly biometric data.
    
    Args:
        df: DataFrame with 'month' and 'total_biometric' columns
    
    Returns:
        DataFrame with engineered features
    """
    df = df.copy()
    
    # Extract month number
    df["month_num"] = df["month"].dt.month
    
    # Lag features (previous months)
    df["lag_1"] = df["total_biometric"].shift(1)
    df["lag_2"] = df["total_biometric"].shift(2)
    
    # Rolling mean (3-month window)
    df["roll_3"] = df["total_biometric"].rolling(window=3, min_periods=1).mean()
    
    return df
