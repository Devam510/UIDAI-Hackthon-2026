#!/usr/bin/env python
"""Test Prophet model training with fresh import"""
import sys
import importlib

# Force reload of modules
if 'backend.ml.forecast.trend_forecast' in sys.modules:
    del sys.modules['backend.ml.forecast.trend_forecast']
if 'backend.ml.data_loader' in sys.modules:
    del sys.modules['backend.ml.data_loader']

sys.path.insert(0, '.')

from backend.ml.forecast.trend_forecast import train_trend_forecast_model

print("Training Gujarat model...")
result = train_trend_forecast_model('Gujarat')
print(f"\nResult Status: {result.get('status')}")
print(f"Monthly Data Points: {result.get('monthly_data_points')}")
print(f"State: {result.get('state')}")

if result.get('status') == 'trained':
    print("\n✅ SUCCESS - Model trained without errors!")
else:
    print(f"\n❌ FAILED - {result.get('message')}")
