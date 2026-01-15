# Alert engine module
from backend.ml.risk.scoring import compute_state_risk
from backend.ml.risk.recommend import recommend_actions
from backend.alerts.rules import classify_level
from backend.alerts.storage import save_alert

from backend.ml.biometric.predict import biometric_risk_score



def generate_state_alert(state: str):
    risk = compute_state_risk(state)
    if risk.get("status") != "success":
        return {"status": "skipped", "state": state}

    score = risk["risk_score"]
    level = classify_level(score)

    if level == "LOW":
        return {"status": "ignored", "state": state, "risk_score": score}

    rec = recommend_actions(state)
    actions = rec.get("recommended_actions", [])

    message = f"State {state} risk={score:.2f}. Actions: {', '.join(actions)}"

    save_alert(
        level=level,
        scope="STATE",
        state=state,
        district=None,
        alert_type="HIGH_RISK",
        message=message
    )

    return {"status": "created", "state": state, "risk_score": score, "level": level}

def generate_biometric_alert(state: str):
    bio = biometric_risk_score(state)
    if bio.get("status") != "success":
        return {"status": "skipped", "state": state}

    score = bio["bio_risk_score"]
    if score < 1.0:
        return {"status": "ignored", "state": state, "bio_risk_score": score}

    level = "HIGH" if score >= 1.5 else "MEDIUM"

    save_alert(
        level=level,
        scope="STATE",
        state=state,
        district=None,
        alert_type="BIO_RISK",
        message=f"Biometric risk high for {state}: score={score:.2f}"
    )

    return {"status": "created", "state": state, "bio_risk_score": score, "level": level}

