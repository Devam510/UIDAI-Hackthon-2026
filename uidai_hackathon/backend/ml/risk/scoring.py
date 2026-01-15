import numpy as np
import pandas as pd

from backend.ml.anomaly.predict import predict_gap_and_anomalies
from backend.ml.forecast.predict import forecast


def compute_state_risk(state: str):
    """
    Returns one risk score per state using:
    - avg anomaly severity (last 30 days)
    - forecasted load growth (next 30 days)
    """

    # ---- anomaly component ----
    anomaly = predict_gap_and_anomalies(state)
    if anomaly.get("status") != "success":
        return anomaly

    df_a = pd.DataFrame(anomaly["results"])
    df_a["anomaly_score"] = pd.to_numeric(df_a["anomaly_score"], errors="coerce").fillna(0)
    df_a["gap"] = pd.to_numeric(df_a["gap"], errors="coerce").fillna(0)

    # severity = mean anomaly score + penalty for negative gaps
    anomaly_severity = float(df_a["anomaly_score"].mean())
    negative_gap_ratio = float((df_a["gap"] < 0).mean())

    # ---- forecast component ----
    fc = forecast(state, days=30)
    if fc.get("status") != "success":
        return fc

    df_f = pd.DataFrame(fc["forecast"])
    df_f["predicted_total_enrolment"] = pd.to_numeric(df_f["predicted_total_enrolment"], errors="coerce").fillna(0)

    growth = float(df_f["predicted_total_enrolment"].iloc[-1] - df_f["predicted_total_enrolment"].iloc[0])
    growth = max(growth, 0.0)  # only positive growth contributes

    # ---- final score ----
    # normalize
    anomaly_part = anomaly_severity
    gap_part = negative_gap_ratio * 10.0
    forecast_part = np.log1p(growth)

    risk_score = 0.55 * anomaly_part + 0.25 * forecast_part + 0.20 * gap_part

    return {
        "status": "success",
        "state": state,
        "risk_score": float(risk_score),
        "components": {
            "anomaly_severity": float(anomaly_part),
            "negative_gap_ratio": float(negative_gap_ratio),
            "forecast_growth_log": float(forecast_part),
        }
    }
