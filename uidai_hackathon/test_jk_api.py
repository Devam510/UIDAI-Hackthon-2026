from backend.analytics.district_risk_analysis import analyze_district_risks

result = analyze_district_risks('Jammu and Kashmir', 30, 10)

print(f"Status: {result['status']}")
print(f"State: {result['state']}")
print(f"Count: {result['count']}")
print(f"Critical: {result['critical_count']}")
print(f"Avg Risk: {result['avg_risk_score']}")

if result.get('districts'):
    print(f"\nFirst 3 districts:")
    for d in result['districts'][:3]:
        print(f"  {d['district']}: {d['risk_score']}")
else:
    print("\nNo districts found!")
    if result.get('metadata'):
        print(f"Message: {result['metadata'].get('message')}")
