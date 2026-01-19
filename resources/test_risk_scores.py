from backend.analytics.district_risk_analysis import analyze_district_risks

result = analyze_district_risks('Gujarat', 30, 10)

print('Total Districts:', result['count'])
print('Critical Count:', result['critical_count'])
print('Avg Risk Score:', result['avg_risk_score'])
print('\nTop 10 Districts:')
for d in result['districts'][:10]:
    print(f"{d['district']:20s}: {d['risk_score']:5.2f} ({d['severity_level']:10s})")
