import pandas as pd

df = pd.read_csv('data/processed/aadhaar_master_monthly.csv')

# Check for Jammu and Kashmir
jk_data = df[df['state'].str.contains('Jammu', case=False, na=False)]

print(f"Rows with 'Jammu': {len(jk_data)}")
if len(jk_data) > 0:
    print(f"State value in CSV: '{jk_data['state'].iloc[0]}'")
    print(f"Number of districts: {jk_data['district'].nunique()}")
    print(f"Districts: {sorted(jk_data['district'].unique())[:5]}")
else:
    print("No data found for Jammu and Kashmir!")
    print("\nAll states in CSV:")
    for state in sorted(df['state'].unique()):
        print(f"  - {state}")
