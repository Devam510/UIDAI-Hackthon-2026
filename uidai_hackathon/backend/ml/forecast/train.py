import pandas as pd
import numpy as np
from sklearn.linear_model import Ridge
from sklearn.model_selection import TimeSeriesSplit
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error

from backend.ml.registry import save_model
from backend.ml.data_loader import get_monthly_enrolment_series


def train_forecast_model(state: str):
    """
    Train Ridge regression forecast model using PROCESSED monthly data.
    
    FIXED: Now uses pre-aggregated monthly data from aadhaar_master_monthly.csv.
    No more daily-to-monthly aggregation during training.
    """
    series = get_monthly_enrolment_series(state=state)

    if series is None or len(series) < 3:
        return {"status": "error", "message": "Not enough monthly enrolment data to train forecast model"}

    df = pd.DataFrame(series)
    df["month"] = pd.to_datetime(df["month"])
    df = df.sort_values("month").reset_index(drop=True)

    # Feature engineering for MONTHLY data
    df["t"] = range(len(df))  # Time index (0, 1, 2, ...)
    df["month_num"] = df["month"].dt.month  # Month of year (1-12)
    df["lag_1"] = df["total_enrolment"].shift(1)  # Previous month
    df["lag_2"] = df["total_enrolment"].shift(2)  # 2 months ago
    df["roll_3"] = df["total_enrolment"].rolling(3).mean()  # 3-month rolling avg

    df = df.dropna()
    if len(df) < 3:
        return {"status": "error", "message": "Not enough history after lag features"}

    X = df[["t", "month_num", "lag_1", "lag_2", "roll_3"]]
    y = df["total_enrolment"]

    # Train final model on all data
    model = Ridge(alpha=1.0)
    model.fit(X, y)

    # REAL VALIDATION: Time-series cross-validation for performance metrics
    if len(df) >= 6:
        tscv = TimeSeriesSplit(n_splits=min(3, len(df) // 3))
        mae_scores = []
        mape_scores = []
        
        for train_idx, val_idx in tscv.split(X):
            X_train, X_val = X.iloc[train_idx], X.iloc[val_idx]
            y_train, y_val = y.iloc[train_idx], y.iloc[val_idx]
            
            val_model = Ridge(alpha=1.0)
            val_model.fit(X_train, y_train)
            y_pred = val_model.predict(X_val)
            
            mae_scores.append(mean_absolute_error(y_val, y_pred))
            mape_scores.append(mean_absolute_percentage_error(y_val, y_pred) * 100)
        
        avg_mae = np.mean(mae_scores)
        avg_mape = np.mean(mape_scores)
    else:
        # Not enough data for CV
        avg_mae = 0
        avg_mape = 0
        mae_scores = []

    # Save model with metadata
    save_model(model, f"forecast_{state}")
    
    # Return training results with REAL validation metrics
    return {
        "status": "trained",
        "model": f"forecast_{state}",
        "monthly_data_points": len(df),
        "validation": {
            "method": "Time-series cross-validation" if mae_scores else "No validation (insufficient data)",
            "folds": len(mae_scores),
            "mae": round(avg_mae, 2),
            "mape": round(avg_mape, 2)
        }
    }
