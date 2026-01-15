import pandas as pd
from sklearn.ensemble import IsolationForest

from backend.ml.registry import load_model, save_model
from backend.ml.data_loader import get_monthly_enrolment_series
from backend.ml.anomaly.train import train_baseline_model


def build_monthly_features(df: pd.DataFrame):
    """Build features for MONTHLY data."""
    df = df.copy()
    df["month_num"] = df["month"].dt.month  # 1-12
    df["lag_1"] = df["total_enrolment"].shift(1)  # Previous month
    df["lag_2"] = df["total_enrolment"].shift(2)  # 2 months ago
    df["roll_3"] = df["total_enrolment"].rolling(3).mean()  # 3-month rolling avg
    return df


def train_gap_anomaly_model(df: pd.DataFrame):
    model = IsolationForest(contamination=0.05, random_state=42)
    model.fit(df[["gap"]])
    save_model(model, "gap_anomaly")
    return model


def predict_gap_and_anomalies(state: str):
    """
    Predict gaps and anomalies using REAL monthly data from processed CSV.
    NO PHANTOM MONTHS!
    """
    series = get_monthly_enrolment_series(state=state)

    # Min data guard (monthly data)
    if series is None or len(series) < 4:
        return {"status": "error", "message": f"Not enough monthly data for state={state}. Need >=4 months."}

    df = pd.DataFrame(series)
    if df.empty:
        return {"status": "error", "message": f"No enrolment data found for state={state}"}

    df["month"] = pd.to_datetime(df["month"])
    df = df.sort_values("month").reset_index(drop=True)

    df = build_monthly_features(df).dropna()
    if df.empty or len(df) < 3:
        return {"status": "error", "message": f"Not enough history for feature engineering in {state}"}

    # Auto-train baseline model if missing
    baseline = load_model(f"baseline_expected_{state}") or load_model("baseline_expected_global")
    if baseline is None:
        train_baseline_model(state=state)
        baseline = load_model(f"baseline_expected_{state}") or load_model("baseline_expected_global")

    if baseline is None:
        return {"status": "error", "message": "Baseline model could not be trained."}

    # Use MONTHLY features
    X = df[["month_num", "lag_1", "lag_2", "roll_3"]]
    df["expected"] = baseline.predict(X)
    df["gap"] = df["total_enrolment"] - df["expected"]

    # anomaly model
    gap_model = load_model("gap_anomaly")
    if gap_model is None:
        gap_model = train_gap_anomaly_model(df)

    df["anomaly_flag"] = gap_model.predict(df[["gap"]])
    df["anomaly_score"] = -gap_model.decision_function(df[["gap"]])

    # Return all available months (not just last 30 days)
    out = df[["month", "total_enrolment", "expected", "gap", "anomaly_flag", "anomaly_score"]]
    out["month"] = out["month"].dt.date.astype(str)
    out = out.rename(columns={"month": "date"})  # Keep API compatibility

    return {
        "status": "success",
        "state": state,
        "results": out.to_dict(orient="records"),
        "data_source": "processed_monthly_csv"
    }
