import requests

try:
    print("Testing Demographic Risks API...")
    r = requests.get(
        "http://localhost:8000/analytics/demographic-risks",
        params={"state": "Gujarat"},
        timeout=10
    )
    
    print(f"Status Code: {r.status_code}\n")
    
    if r.status_code == 200:
        data = r.json()
        print(f"Status: {data.get('status')}")
        print(f"Total Segments: {data.get('total_segments')}")
        print(f"Critical Segments: {data.get('critical_segments')}")
        print(f"Avg Risk Score: {data.get('avg_risk_score')}")
        print(f"Highest Risk: {data.get('highest_risk_segment')}")
        
        if data.get('segments'):
            print(f"\nTop 3 Segments:")
            for seg in data['segments'][:3]:
                print(f"  - {seg['demographic_group']}: Risk {seg['risk_score']} ({seg['severity_level']})")
    else:
        print(f"Error: {r.text[:500]}")
except Exception as e:
    print(f"ERROR: {e}")
