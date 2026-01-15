import requests
import time

print("Testing District Risks API...")
start = time.time()

try:
    response = requests.get(
        "http://localhost:8000/analytics/district-risks",
        params={"state": "Gujarat", "window": 30, "top": 5},
        timeout=30
    )
    elapsed = time.time() - start
    
    print(f"Response time: {elapsed:.2f}s")
    print(f"Status code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {data.get('status')}")
        print(f"Count: {data.get('count')}")
        print(f"Critical: {data.get('critical_count')}")
        print(f"Avg Risk: {data.get('avg_risk_score')}")
        
        if data.get('districts'):
            print("\nFirst 3 districts:")
            for d in data['districts'][:3]:
                print(f"  {d['district']}: {d['risk_score']} ({d['severity_level']})")
    else:
        print(f"Error: {response.text}")
        
except requests.exceptions.Timeout:
    print("ERROR: Request timed out after 30 seconds!")
except Exception as e:
    print(f"ERROR: {e}")
