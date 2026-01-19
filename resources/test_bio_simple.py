import requests

try:
    print("Testing Biometric Hotspots API...")
    response = requests.get(
        "http://localhost:8000/ml/biometric/hotspots",
        params={"state": "Gujarat"},
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"Status: {data.get('status')}")
        print(f"Hotspots Count: {len(data.get('hotspots', []))}")
        print(f"Avg Risk Score: {data.get('avg_risk_score')}")
        print(f"Severe Count: {data.get('severe_count')}")
        print(f"Trend: {data.get('trend')}")
        
        if data.get('hotspots'):
            print("\nTop 3 Hotspots:")
            for h in data['hotspots'][:3]:
                print(f"  {h['district']}: {h['score']} ({h['severity']})")
    else:
        print(f"Error: {response.text[:500]}")
except Exception as e:
    print(f"ERROR: {e}")
