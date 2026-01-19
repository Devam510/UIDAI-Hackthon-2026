import requests
import json

print("Testing Biometric Hotspots API...")

try:
    response = requests.get(
        "http://localhost:8000/ml/biometric-hotspots",
        params={"state": "Gujarat", "top": 5},
        timeout=30
    )
    
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"\nStatus: {data.get('status')}")
        print(f"State: {data.get('state')}")
        print(f"Avg Risk Score: {data.get('avg_risk_score')}")
        print(f"Severe Count: {data.get('severe_count')}")
        print(f"Trend: {data.get('trend')}")
        
        if data.get('worst_district'):
            print(f"Worst District: {data['worst_district']['name']} (Score: {data['worst_district']['score']})")
        
        if data.get('hotspots'):
            print(f"\nTop 3 Hotspots:")
            for h in data['hotspots'][:3]:
                print(f"  {h['district']}: {h['score']} ({h['severity']})")
                print(f"    Bio Gap: {h['bio_gap_abs_mean_30']}, Neg Gap: {h['bio_negative_gap_ratio_30']}%")
                print(f"    Trend Data Length: {len(h['trend_data'])}")
        
        if data.get('metadata'):
            print(f"\nMetadata:")
            print(f"  CSV Source: {data['metadata'].get('csv_source')}")
            print(f"  Model Type: {data['metadata'].get('model_type')}")
    else:
        print(f"Error: {response.text}")
        
except Exception as e:
    print(f"ERROR: {e}")
