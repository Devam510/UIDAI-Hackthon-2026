"""Test model training with processed monthly data"""
from backend.ml.forecast.train import train_forecast_model
from backend.ml.anomaly.train import train_baseline_model
from backend.ml.biometric.train import train_biometric_baseline_model

print("=" * 60)
print("TESTING MODEL TRAINING WITH PROCESSED MONTHLY DATA")
print("=" * 60)

# Test 1: Forecast model
print("\n1. Testing Forecast Model (Bihar)...")
try:
    result = train_forecast_model("Bihar")
    print(f"   ✅ Status: {result['status']}")
    print(f"   ✅ Model: {result['model']}")
    print(f"   ✅ Data points: {result['monthly_data_points']}")
    if 'validation' in result:
        print(f"   ✅ Validation: {result['validation']['method']}")
        print(f"      MAE: {result['validation']['mae']}, MAPE: {result['validation']['mape']}%")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Anomaly detection model
print("\n2. Testing Anomaly Detection Model (Bihar)...")
try:
    result = train_baseline_model("Bihar")
    print(f"   ✅ Status: {result['status']}")
    print(f"   ✅ Model: {result['model']}")
    print(f"   ✅ Rows: {result['rows']}")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Biometric model
print("\n3. Testing Biometric Model (Bihar)...")
try:
    result = train_biometric_baseline_model("Bihar")
    print(f"   ✅ Status: {result['status']}")
    print(f"   ✅ Model: {result['model']}")
    print(f"   ✅ Rows: {result['rows']}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print("\n" + "=" * 60)
print("ALL TESTS COMPLETED!")
print("=" * 60)
