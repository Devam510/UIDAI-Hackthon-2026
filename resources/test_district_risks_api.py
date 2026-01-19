"""
Quick test script to verify District Risks API endpoint.
"""
import requests
import json

def test_district_risks():
    """Test the district-risks endpoint."""
    url = "http://localhost:8000/analytics/district-risks"
    params = {
        "state": "Delhi",
        "window": 30,
        "top": 5
    }
    
    print("Testing District Risks API...")
    print(f"URL: {url}")
    print(f"Params: {params}")
    print("-" * 50)
    
    try:
        response = requests.get(url, params=params, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Response Status: {data.get('status')}")
            print(f"State: {data.get('state')}")
            print(f"Total Districts: {data.get('count')}")
            print(f"Critical Count: {data.get('critical_count')}")
            print(f"Avg Risk Score: {data.get('avg_risk_score')}")
            
            if data.get('metadata'):
                print(f"\nMetadata:")
                print(f"  CSV Source: {data['metadata'].get('csv_source')}")
                print(f"  Model Type: {data['metadata'].get('model_type')}")
            
            if data.get('districts'):
                print(f"\nFirst District:")
                first = data['districts'][0]
                print(f"  Name: {first.get('district')}")
                print(f"  Risk Score: {first.get('risk_score')}")
                print(f"  Severity: {first.get('severity_level')}")
                print(f"  Has ML Metadata: {'ml_metadata' in first}")
            
            print("\n✅ API TEST PASSED")
        else:
            print(f"❌ API returned error: {response.text}")
    
    except Exception as e:
        print(f"❌ API TEST FAILED: {e}")

if __name__ == "__main__":
    test_district_risks()
