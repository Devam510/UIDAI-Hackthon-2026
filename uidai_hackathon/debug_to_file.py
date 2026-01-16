#!/usr/bin/env python
"""Get full traceback of the error and write to file"""
import sys
sys.path.insert(0, '.')

try:
    from backend.ml.forecast.trend_forecast import train_trend_forecast_model
    print("Training Gujarat model...")
    result = train_trend_forecast_model('Gujarat')
    print(f"SUCCESS: {result['status']}")
    with open('success_output.txt', 'w') as f:
        f.write(str(result))
except Exception as e:
    import traceback
    error_msg = traceback.format_exc()
    with open('error_traceback.txt', 'w') as f:
        f.write(error_msg)
    print("Error occurred - see error_traceback.txt for details")
    print(error_msg)
