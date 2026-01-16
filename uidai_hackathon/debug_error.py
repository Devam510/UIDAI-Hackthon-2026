#!/usr/bin/env python
"""Get full traceback of the error"""
import sys
sys.path.insert(0, '.')

try:
    from backend.ml.forecast.trend_forecast import train_trend_forecast_model
    print("Training Gujarat model...")
    result = train_trend_forecast_model('Gujarat')
    print(f"Result: {result}")
except Exception as e:
    import traceback
    print("\n" + "="*80)
    print("FULL TRACEBACK:")
    print("="*80)
    for line in traceback.format_exc().split('\n'):
        print(line)
    print("="*80)
