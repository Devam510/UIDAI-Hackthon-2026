import requests

response = requests.get(
    "http://localhost:8000/analytics/district-risks",
    params={"state": "Gujarat", "window": 30, "top": 3},
    timeout=10
)

data = response.json()

print("=== DISTRICT RISKS VERIFICATION ===\n")
print(f"Total Districts: {data['count']}")
print(f"Critical Count: {data['critical_count']}")
print(f"Avg Risk Score: {data['avg_risk_score']}\n")

for i, d in enumerate(data['districts'][:3], 1):
    print(f"{i}. {d['district']}")
    print(f"   Risk Score: {d['risk_score']} ({d['severity_level']})")
    print(f"   Trend Data (first 5 values): {d['trend_data'][:5]}")
    print(f"   Trend Data (last 5 values): {d['trend_data'][-5:]}")
    
    # Check if trend is varied
    unique_values = len(set(d['trend_data']))
    if unique_values == 1:
        print(f"   ⚠️ WARNING: Trend has only 1 unique value (flat line)")
    else:
        print(f"   ✅ Trend has {unique_values} unique values (varied data)")
    print()
