from pathlib import Path

# Test path resolution
file_location = Path(__file__).resolve()
print(f"File location: {file_location}")

project_root = file_location.parents[3]
print(f"Project root (3 levels up): {project_root}")

csv_path = project_root / "data" / "processed" / "aadhaar_master_monthly.csv"
print(f"CSV path: {csv_path}")
print(f"CSV exists: {csv_path.exists()}")

# Try different levels
for i in range(5):
    test_root = file_location.parents[i]
    test_csv = test_root / "data" / "processed" / "aadhaar_master_monthly.csv"
    print(f"\nLevel {i}: {test_root}")
    print(f"  CSV path: {test_csv}")
    print(f"  Exists: {test_csv.exists()}")
