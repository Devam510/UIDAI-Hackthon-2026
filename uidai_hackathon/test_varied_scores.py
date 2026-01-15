import requests

states = ["Gujarat", "Maharashtra", "Bihar", "Uttar Pradesh", "Tamil Nadu"]

print("Testing varied risk scores across states:\n")
for state in states:
    try:
        r = requests.get(
            "http://localhost:8000/analytics/state-summary",
            params={"state": state},
            timeout=10
        )
        if r.status_code == 200:
            data = r.json()
            print(f"{state:20s} - Risk: {data['risk_score']:5.2f}  Anomaly: {data['anomaly_severity']:8s}  Gap: {data['negative_gap_ratio']}")
        else:
            print(f"{state:20s} - ERROR")
    except Exception as e:
        print(f"{state:20s} - TIMEOUT/ERROR: {e}")
