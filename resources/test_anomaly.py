import requests

states = ["Gujarat", "Maharashtra", "Bihar", "Uttar Pradesh", "Tamil Nadu", "Rajasthan", "Karnataka", "West Bengal"]

print("Testing varied anomaly severities:\n")
print(f"{'State':<20} {'Risk':>6} {'Anomaly':>10}")
print("-" * 40)

for state in states:
    try:
        r = requests.get(
            "http://localhost:8000/analytics/state-summary",
            params={"state": state},
            timeout=5
        )
        if r.status_code == 200:
            data = r.json()
            print(f"{state:<20} {data['risk_score']:>6.2f} {data['anomaly_severity']:>10}")
    except:
        print(f"{state:<20} ERROR")
