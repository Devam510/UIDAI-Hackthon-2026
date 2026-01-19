# Biometric prediction module
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

from backend.ml.registry import load_model, save_model
from backend.ml.data_loader import get_monthly_biometric_series
from backend.ml.biometric.train import train_biometric_baseline_model


def build_monthly_features(df: pd.DataFrame):
    """Build features for MONTHLY biometric data."""
    df = df.copy()
    df["month_num"] = df["month"].dt.month  # 1-12
    df["lag_1"] = df["total_biometric"].shift(1)  # Previous month
    df["lag_2"] = df["total_biometric"].shift(2)  # 2 months ago
    df["roll_3"] = df["total_biometric"].rolling(3).mean()  # 3-month rolling avg
    return df


def _train_bio_gap_anomaly(df: pd.DataFrame):
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(df[["bio_gap"]])
    save_model(model, "bio_gap_anomaly")
    return model


def biometric_gap_anomaly(state: str):
    """
    Predict biometric gaps and anomalies using REAL monthly data from processed CSV.
    NO PHANTOM MONTHS!
    """
    series = get_monthly_biometric_series(state=state)

    if series is None or len(series) < 4:
        return {"status": "error", "message": f"Not enough monthly biometric data for {state}"}

    df = pd.DataFrame(series)
    df["month"] = pd.to_datetime(df["month"])
    df = df.sort_values("month").reset_index(drop=True)

    df = build_monthly_features(df).dropna()
    if df.empty or len(df) < 3:
        return {"status": "error", "message": "Not enough biometric history after features"}

    baseline = load_model(f"bio_expected_{state}") or load_model("bio_expected_global")
    if baseline is None:
        train_biometric_baseline_model(state=state)
        baseline = load_model(f"bio_expected_{state}") or load_model("bio_expected_global")

    if baseline is None:
        return {"status": "error", "message": "Biometric baseline could not be trained"}

    # Use MONTHLY features
    X = df[["month_num", "lag_1", "lag_2", "roll_3"]]
    df["bio_expected"] = baseline.predict(X)
    df["bio_gap"] = df["total_biometric"] - df["bio_expected"]

    gap_model = load_model("bio_gap_anomaly")
    if gap_model is None:
        gap_model = _train_bio_gap_anomaly(df)

    df["anomaly_flag"] = gap_model.predict(df[["bio_gap"]])
    df["anomaly_score"] = -gap_model.decision_function(df[["bio_gap"]])

    # Return all available months
    out = df[["month", "total_biometric", "bio_expected", "bio_gap", "anomaly_flag", "anomaly_score"]]
    out["month"] = out["month"].dt.date.astype(str)
    out = out.rename(columns={"month": "date"})  # Keep API compatibility

    return {
        "status": "success",
        "state": state,
        "results": out.to_dict(orient="records"),
        "data_source": "processed_monthly_csv"
    }


def biometric_risk_score(state: str):
    out = biometric_gap_anomaly(state)
    if out.get("status") != "success":
        return out

    df = pd.DataFrame(out["results"])
    df["bio_gap"] = pd.to_numeric(df["bio_gap"], errors="coerce").fillna(0)
    df["anomaly_score"] = pd.to_numeric(df["anomaly_score"], errors="coerce").fillna(0)

    gap_abs_mean = float(df["bio_gap"].abs().mean())
    neg_ratio = float((df["bio_gap"] < 0).mean())
    sev = float(df["anomaly_score"].mean())

    risk = 0.5 * np.log1p(gap_abs_mean) + 0.3 * (neg_ratio * 10) + 0.2 * sev

    return {
        "status": "success",
        "state": state,
        "bio_risk_score": float(risk),
        "components": {
            "gap_abs_mean": gap_abs_mean,
            "negative_gap_ratio": neg_ratio,
            "anomaly_severity": sev,
        }
    }
