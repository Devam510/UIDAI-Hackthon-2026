import joblib
from pathlib import Path

model_path = Path("data/models/forecast_Gujarat.joblib")
if model_path.exists():
    model = joblib.load(model_path)
    print(f"Model type: {type(model)}")
    print(f"Is dict: {isinstance(model, dict)}")
    if isinstance(model, dict):
        print(f"Dict keys: {list(model.keys())}")
    print(f"Has predict: {hasattr(model, 'predict')}")
    print(f"Has make_future_dataframe: {hasattr(model, 'make_future_dataframe')}")
else:
    print("Model file not found")
