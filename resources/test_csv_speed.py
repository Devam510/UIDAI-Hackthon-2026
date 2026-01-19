from backend.ml.data_loader import load_processed_data
import time

print("Testing CSV load speed...")
start = time.time()

df = load_processed_data(validate=False)

elapsed = time.time() - start
print(f"✅ CSV loaded in {elapsed:.2f} seconds")
print(f"Rows: {len(df)}")
print(f"States: {df['state'].nunique()}")
print(f"Districts: {df['district'].nunique()}")
