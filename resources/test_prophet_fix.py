import traceback
import sys
import json
sys.path.insert(0, '.')

try:
    from backend.ml.forecast.trend_forecast import train_trend_forecast_model
    result = train_trend_forecast_model('Gujarat')
    print("Training completed successfully!")
    print("Attempting to serialize result to JSON...")
    json_result = json.dumps(result, indent=2, default=str)
    print("SUCCESS - Result is JSON serializable")
    print(json_result[:500])
except Exception as e:
    print("=" * 60)
    print("FULL ERROR TRACEBACK:")
    print("=" * 60)
    traceback.print_exc()
    print("=" * 60)
