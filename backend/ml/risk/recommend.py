from backend.ml.risk.scoring import compute_state_risk
from backend.ml.anomaly.predict import predict_gap_and_anomalies


def recommend_actions(state: str):
    risk = compute_state_risk(state)
    if risk.get("status") != "success":
        return risk

    anomaly = predict_gap_and_anomalies(state)
    if anomaly.get("status") != "success":
        return anomaly

    results = anomaly["results"]
    recent = results[-7:] if len(results) >= 7 else results

    # simple decisions (judge-friendly)
    avg_gap = sum(x["gap"] for x in recent) / max(len(recent), 1)
    avg_anom = sum(x["anomaly_score"] for x in recent) / max(len(recent), 1)

    actions = []
    if avg_gap < 0:
        actions.append("Investigate enrolment drop: possible connectivity/device/center outage")
        actions.append("Deploy temporary enrolment camp or staff support")

    if avg_anom > 0.4:
        actions.append("Flag state for operational audit: abnormal deviation detected")

    if risk["risk_score"] > 1.0:
        actions.append("High priority state: allocate additional resources and monitoring")

    if not actions:
        actions.append("No urgent action required: enrolment pattern stable")

    return {
        "status": "success",
        "state": state,
        "risk_score": risk["risk_score"],
        "recommended_actions": actions
    }
