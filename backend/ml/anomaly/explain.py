"""
Anomaly Model Explanation
Methods for explaining anomaly detection predictions.
"""
import pandas as pd


def explain_anomaly(results: list, top_k: int = 5):
    """
    Takes /ml/anomaly/gap results and returns top anomaly days + reasons.
    """
    df = pd.DataFrame(results)
    if df.empty:
        return []

    df["gap"] = pd.to_numeric(df["gap"], errors="coerce").fillna(0)
    df["anomaly_score"] = pd.to_numeric(df["anomaly_score"], errors="coerce").fillna(0)

    df = df.sort_values("anomaly_score", ascending=False).head(top_k)

    explained = []
    for _, r in df.iterrows():
        reason = "sudden negative gap" if r["gap"] < 0 else "sudden spike"
        explained.append({
            "date": r["date"],
            "anomaly_score": float(r["anomaly_score"]),
            "gap": float(r["gap"]),
            "reason": reason
        })

    return explained
