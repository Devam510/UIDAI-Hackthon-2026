import requests
import time

print("Testing Home Page API (with timing)...")
start = time.time()

try:
    response = requests.get(
        "http://localhost:8000/analytics/state-summary",
        params={"state": "Gujarat"},
        timeout=60  # Increase timeout to 60 seconds
    )
    
    elapsed = time.time() - start
    print(f"\n✅ Response received in {elapsed:.2f} seconds")
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nStatus: {data.get('status')}")
        print(f"Risk Score: {data.get('risk_score')}")
        print(f"Anomaly Severity: {data.get('anomaly_severity')}")
        print(f"Negative Gap Ratio: {data.get('negative_gap_ratio')}")
        print(f"Forecast Growth: {data.get('forecast_growth')}")
        print(f"Top District: {data.get('top_district')}")
        print(f"Priority States: {len(data.get('top_priority_states', []))}")
    else:
        print(f"Error: {response.text[:500]}")
except requests.Timeout:
    elapsed = time.time() - start
    print(f"\n❌ TIMEOUT after {elapsed:.2f} seconds")
except Exception as e:
    elapsed = time.time() - start
    print(f"\n❌ ERROR after {elapsed:.2f} seconds: {e}")
