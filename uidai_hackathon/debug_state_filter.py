import pandas as pd
from backend.ml.data_loader import load_processed_data
from backend.common.state_resolver import resolve_state

# Load CSV
df = load_processed_data(validate=False)

# Resolve state name
state = resolve_state('Jammu and Kashmir')
print(f"Resolved state name: '{state}'")

# Check CSV states
csv_states = df['state'].unique()
print(f"\nStates in CSV containing 'Jammu':")
for s in csv_states:
    if 'jammu' in s.lower():
        print(f"  '{s}'")

# Try filtering
filtered = df[df['state'] == state]
print(f"\nFiltered rows: {len(filtered)}")

# Try case-insensitive
filtered_ci = df[df['state'].str.lower() == state.lower()]
print(f"Case-insensitive filtered rows: {len(filtered_ci)}")

# Check exact match
jk_rows = df[df['state'] == 'Jammu and Kashmir']
print(f"\nDirect 'Jammu and Kashmir' match: {len(jk_rows)}")

# Show first few state values
print(f"\nFirst 5 unique states in CSV:")
for s in sorted(csv_states)[:5]:
    print(f"  '{s}'")
