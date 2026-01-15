"""
Debug script for biometric district hotspots pipeline.

This script:
1. Tests series retrieval for a specific district (Lucknow)
2. Tests model loading with multiple fallback keys
3. Runs compute_biometric_district_risk on top biometric districts
4. Prints skip-reason histogram
5. Validates that biometric hotspots are working
"""

from collections import defaultdict
from backend.common.state_resolver import resolve_state
from backend.common.key_utils import slugify_key
from backend.ml.common import get_total_biometric_series, list_biometric_districts
from backend.ml.registry import load_model
from backend.ml.risk.biometric_district_scoring import compute_biometric_district_risk


def test_single_district():
    """Test biometric hotspot computation for Lucknow."""
    print("\n" + "="*80)
    print("TEST 1: Single District (Lucknow)")
    print("="*80)
    
    state = "UP"
    district = "Lucknow"
    
    resolved_state = resolve_state(state)
    print(f"\n1. State Resolution:")
    print(f"   Input: {state} -> Resolved: {resolved_state}")
    
    # Get biometric series
    series = get_total_biometric_series(state=resolved_state, district=district)
    print(f"\n2. Biometric Series for {district}:")
    print(f"   Series length: {len(series) if series else 0}")
    if series:
        print(f"   Date range: {series[0]['date']} to {series[-1]['date']}")
        print(f"   First 3 rows: {series[:3]}")
    
    # Check baseline models
    key = slugify_key(resolved_state)
    print(f"\n3. Model Loading:")
    print(f"   Slugified key: {key}")
    
    model1 = load_model(f"bio_expected_{key}")
    print(f"   bio_expected_{key}: {'FOUND' if model1 else 'NOT FOUND'}")
    
    model2 = load_model("bio_expected_global")
    print(f"   bio_expected_global: {'FOUND' if model2 else 'NOT FOUND'}")
    
    # Run compute_biometric_district_risk
    print(f"\n4. Running compute_biometric_district_risk({resolved_state}, {district}):")
    result = compute_biometric_district_risk(resolved_state, district)
    
    print(f"   Status: {result.get('status')}")
    if result.get('status') == 'success':
        print(f"   Bio Risk Score: {result.get('bio_risk_score'):.4f}")
        print(f"   Points Used: {result.get('points_used')}")
        print(f"   Model Key Used: {result.get('model_key_used')}")
        print(f"   Components: {result.get('components')}")
    else:
        print(f"   Reason: {result.get('reason')}")


def test_top_districts():
    """Test biometric hotspot computation for top districts in a state."""
    print("\n" + "="*80)
    print("TEST 2: Top Biometric Districts in UP (Top 30)")
    print("="*80)
    
    state = "UP"
    resolved_state = resolve_state(state)
    
    # Get top districts by biometric row count
    districts = list_biometric_districts(resolved_state, limit=30)
    print(f"\nFound {len(districts)} districts with biometric data")
    
    results = []
    skip_reasons = defaultdict(int)
    
    for i, district in enumerate(districts, 1):
        result = compute_biometric_district_risk(resolved_state, district)
        results.append({
            "district": district,
            "result": result
        })
        
        if result.get('status') == 'success':
            print(f"  {i:2d}. {district:20s} -> SUCCESS (risk={result['bio_risk_score']:.4f}, points={result['points_used']})")
        else:
            reason = result.get('reason', 'unknown')
            skip_reasons[reason] += 1
            print(f"  {i:2d}. {district:20s} -> SKIPPED ({reason})")
    
    # Summary
    print("\n" + "-"*80)
    success_count = sum(1 for r in results if r['result'].get('status') == 'success')
    print(f"\nSUMMARY:")
    print(f"  Total districts checked: {len(results)}")
    print(f"  Successful: {success_count}")
    print(f"  Skipped: {len(results) - success_count}")
    
    if skip_reasons:
        print(f"\nSkip Reasons Histogram:")
        for reason, count in sorted(skip_reasons.items(), key=lambda x: -x[1]):
            print(f"  {reason:30s}: {count}")
    
    return results


if __name__ == "__main__":
    test_single_district()
    test_top_districts()
    print("\n" + "="*80)
    print("DEBUG TEST COMPLETE")
    print("="*80)
