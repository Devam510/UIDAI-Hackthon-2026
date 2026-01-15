from backend.ml.data_loader import load_processed_data, validate_monthly_data

# Test data loading
df = load_processed_data(validate=True)
print(f"✅ Data loaded: {len(df)} records")
print(f"✅ Date range: {df['month'].min()} to {df['month'].max()}")
print(f"✅ States: {df['state'].nunique()}")
print(f"✅ Districts: {df['district'].nunique()}")
print("\n✅ Data validation passed!")
