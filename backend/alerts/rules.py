# Alert rules module
def classify_level(risk_score: float):
    if risk_score >= 1.5:
        return "HIGH"
    if risk_score >= 1.0:
        return "MEDIUM"
    return "LOW"
    