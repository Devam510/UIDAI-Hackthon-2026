"""
Script to extract forecast data from the notebook's trained Prophet model
and save it in a format the backend can serve
"""
import sys
import os

# Add the notebook directory to path
notebook_dir = r'd:\Devam\Microsoft VS Code\Codes\UIDAI\UIDAI Hackthon\uidai_hackathon\notebooks'
sys.path.insert(0, notebook_dir)

# Change to notebook directory to access saved model
os.chdir(notebook_dir)

import pandas as pd
import pickle
from pathlib import Path

# Try to load the saved Prophet model from the notebook
model_files = list(Path('.').glob('*prophet*.pkl'))

if model_files:
    print(f"Found model files: {model_files}")
    
    # Load the first Prophet model found
    with open(model_files[0], 'rb') as f:
        model = pickle.load(f)
    
    print(f"✅ Loaded Prophet model from {model_files[0]}")
    
    # Generate forecast for 12 months
    future = model.make_future_dataframe(periods=12, freq='MS')
    forecast = model.predict(future)
    
    # Extract trend component (this is what the notebook shows)
    forecast_data = forecast[['ds', 'trend', 'yhat_lower', 'yhat_upper', 'yhat']].tail(12)
    
    print("\nTrend Forecast (next 12 months):")
    print(forecast_data.to_string(index=False))
    
    # Save to JSON for backend
    output = []
    for _, row in forecast_data.iterrows():
        output.append({
            'date': str(row['ds'].date()),
            'value': float(row['trend']),  # Use trend component
            'lower': float(row['yhat_lower']),
            'upper': float(row['yhat_upper'])
        })
    
    import json
    output_file = r'd:\Devam\Microsoft VS Code\Codes\UIDAI\UIDAI Hackthon\notebook_forecast.json'
    with open(output_file, 'w') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Saved forecast to {output_file}")
    
else:
    print("❌ No Prophet model files found in notebook directory")
    print("Please run the notebook cells to train and save the model first")
