import pandas as pd
from sklearn.ensemble import RandomForestRegressor

from backend.ml.registry import save_model
from backend.ml.data_loader import get_monthly_enrolment_series


def make_monthly_features(df: pd.DataFrame):
    """Create features for MONTHLY data."""
    df = df.copy()
    df["month_num"] = df["month"].dt.month  # Month of year (1-12)
    df["lag_1"] = df["total_enrolment"].shift(1)  # Previous month
    df["lag_2"] = df["total_enrolment"].shift(2)  # 2 months ago
    df["roll_3"] = df["total_enrolment"].rolling(3).mean()  # 3-month rolling avg
    return df


def train_baseline_model(state: str = None):
    """
    Train baseline anomaly detection model using PROCESSED monthly data.
    
    FIXED: Now uses pre-aggregated monthly data from aadhaar_master_monthly.csv.
    """
    series = get_monthly_enrolment_series(state=state)

    if series is None or len(series) < 4:
        return {"status": "error", "message": "Not enough monthly enrolment data to train baseline model"}

    df = pd.DataFrame(series)
    df["month"] = pd.to_datetime(df["month"])
    df = df.sort_values("month").reset_index(drop=True)

    df = make_monthly_features(df).dropna()
    if df.empty or len(df) < 3:
        return {"status": "error", "message": "Not enough data after feature creation"}

    X = df[["month_num", "lag_1", "lag_2", "roll_3"]]
    y = df["total_enrolment"]

    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X, y)

    model_name = "baseline_expected_global" if not state else f"baseline_expected_{state}"
    save_model(model, model_name)

    return {"status": "trained", "model": model_name, "rows": len(df)}
