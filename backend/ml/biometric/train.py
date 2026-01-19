import pandas as pd
from sklearn.ensemble import RandomForestRegressor

from backend.common.state_resolver import resolve_state
from backend.common.key_utils import slugify_key
from backend.ml.data_loader import get_monthly_biometric_series
from backend.ml.registry import save_model


def train_biometric_baseline_model(state: str = None):
    """
    Train a baseline model to estimate expected biometric volume using PROCESSED monthly data.
    
    FIXED: Now uses pre-aggregated monthly data from aadhaar_master_monthly.csv.
    
    Saves model as:
      - bio_expected_global  (if state is None)
      - bio_expected_<slug>  (if state given)
    """
    if state:
        state = resolve_state(state)

    series = get_monthly_biometric_series(state=state)
    if not series or len(series) < 4:
        return {"status": "error", "message": "Not enough monthly biometric data"}

    df = pd.DataFrame(series)
    df["month"] = pd.to_datetime(df["month"])
    df = df.sort_values("month").reset_index(drop=True)

    # Feature engineering for MONTHLY data
    df["month_num"] = df["month"].dt.month  # Month of year (1-12)
    df["lag_1"] = df["total_biometric"].shift(1)  # Previous month
    df["lag_2"] = df["total_biometric"].shift(2)  # 2 months ago
    df["roll_3"] = df["total_biometric"].rolling(3).mean()  # 3-month rolling avg

    df = df.dropna()
    if df.empty or len(df) < 3:
        return {"status": "error", "message": "Not enough biometric data after features"}

    X = df[["month_num", "lag_1", "lag_2", "roll_3"]]
    y = df["total_biometric"]

    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X, y)

    if state:
        model_name = f"bio_expected_{slugify_key(state)}"
    else:
        model_name = "bio_expected_global"

    path = save_model(model, model_name)

    return {
        "status": "trained",
        "state": state,
        "model": model_name,
        "saved_to": path,
        "rows": len(df),
    }
