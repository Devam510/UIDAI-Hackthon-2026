"""
Train Prophet forecast models for all states locally
This avoids the Prophet serialization issues on Render
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from backend.ml.forecast.trend_forecast import train_trend_forecast_model

# All Indian states
states = [
    "Andaman and Nicobar Islands",
    "Andhra Pradesh",
    "Arunachal Pradesh",
    "Assam",
    "Bihar",
    "Chandigarh",
    "Chhattisgarh",
    "Dadra and Nagar Haveli and Daman and Diu",
    "Delhi",
    "Goa",
    "Gujarat",
    "Haryana",
    "Himachal Pradesh",
    "Jammu and Kashmir",
    "Jharkhand",
    "Karnataka",
    "Kerala",
    "Ladakh",
    "Lakshadweep",
    "Madhya Pradesh",
    "Maharashtra",
    "Manipur",
    "Meghalaya",
    "Mizoram",
    "Nagaland",
    "Odisha",
    "Puducherry",
    "Punjab",
    "Rajasthan",
    "Sikkim",
    "Tamil Nadu",
    "Telangana",
    "Tripura",
    "Uttar Pradesh",
    "Uttarakhand",
    "West Bengal"
]

print("=" * 60)
print("Training Prophet Models for All States (Locally)")
print("=" * 60)
print(f"\nTotal states: {len(states)}\n")

success_count = 0
failed_count = 0
failed_states = []

for i, state in enumerate(states, 1):
    print(f"[{i}/{len(states)}] Training: {state}")
    
    try:
        result = train_trend_forecast_model(state)
        
        if result.get("status") == "trained":
            data_points = result.get("monthly_data_points", "?")
            print(f"  ✓ Success - {data_points} months of data")
            success_count += 1
        else:
            print(f"  ✗ Failed: {result.get('message', 'Unknown error')}")
            failed_count += 1
            failed_states.append(state)
    except Exception as e:
        print(f"  ✗ Error: {str(e)}")
        failed_count += 1
        failed_states.append(state)

print("\n" + "=" * 60)
print("Training Complete!")
print("=" * 60)
print(f"Success: {success_count}")
print(f"Failed: {failed_count}")

if failed_states:
    print(f"\nFailed states:")
    for state in failed_states:
        print(f"  - {state}")

print("\n✓ Models saved to: uidai_hackathon/data/models/")
print("✓ Commit and push these models to deploy to Render")
