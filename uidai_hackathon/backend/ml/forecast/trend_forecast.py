"""
Trend-Only Prophet Forecast Module
Replicates the exact approach from 09_demand_forecasting.ipynb
"""

import pandas as pd
import numpy as np
from datetime import datetime
from pathlib import Path
import joblib
import json

try:
    from prophet import Prophet
    PROPHET_AVAILABLE = True
except ImportError:
    PROPHET_AVAILABLE = False

from backend.ml.data_loader import get_monthly_enrolment_series

# Artifacts directory - use data/models where forecast models are stored
PROJECT_ROOT = Path(__file__).resolve().parents[3]  # Go up to uidai_hackathon root
ARTIFACTS_DIR = PROJECT_ROOT / "data" / "models"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)


def train_trend_forecast_model(state: str):
    """
    Train a TREND-ONLY Prophet model (no seasonality)
    This matches the notebook's approach for handling missing data
    """
    if not PROPHET_AVAILABLE:
        return {"status": "error", "message": "Prophet not installed"}
    
    print(f"[Trend Forecast] Training trend-only model for {state}")
    
    # Get monthly data
    series = get_monthly_enrolment_series(state=state)
    if not series or len(series) < 3:
        return {"status": "error", "message": "Insufficient data"}
    
    # Prepare Prophet format
    df = pd.DataFrame(series)
    df['month'] = pd.to_datetime(df['month'])
    df = df.sort_values('month').reset_index(drop=True)
    
    prophet_df = pd.DataFrame({
        'ds': df['month'],
        'y': df['total_enrolment']
    })
    
    print(f"[Trend Forecast] Training on {len(prophet_df)} months")
    print(f"[Trend Forecast] Range: {prophet_df['ds'].min()} to {prophet_df['ds'].max()}")
    
    # EXACT configuration from notebook - TREND ONLY
    model = Prophet(
        yearly_seasonality=False,  # NO seasonality
        weekly_seasonality=False,
        daily_seasonality=False,
        changepoint_prior_scale=0.05,  # Low flexibility for smooth trend
        interval_width=0.95
    )
    
    model.fit(prophet_df)
    
    # Save model using joblib (matches existing models)
    model_path = ARTIFACTS_DIR / f"forecast_{state}.joblib"
    joblib.dump(model, model_path)
    
    metadata = {
        "state": state,
        "model_type": "Prophet (Trend-Only)",
        "training_date": datetime.now().isoformat(),
        "data_points": len(prophet_df),
        "date_range_start": str(prophet_df['ds'].min().date()),
        "date_range_end": str(prophet_df['ds'].max().date()),
        "seasonality": "none",
        "interval_width": 0.95
    }
    
    metadata_path = ARTIFACTS_DIR / f"trend_forecast_{state}_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"[Trend Forecast] Saved to {model_path}")
    
    return {"status": "trained", "state": state, "metadata": metadata}


def predict_trend_forecast(state: str, days: int = 30):
    """
    Generate TREND DIRECTION ANALYSIS (not predictions)
    Returns historical data + short-term trend projection for visualization only
    
    CRITICAL: This is NOT a prediction system - it shows trend direction only
    Limited 2025 data makes 2026 predictions unreliable
    """
    print(f"[Trend Forecast] Starting forecast for state: '{state}'")
    
    if not PROPHET_AVAILABLE:
        return {"status": "error", "message": "Prophet not installed"}
    
    model_path = ARTIFACTS_DIR / f"forecast_{state}.joblib"
    metadata_path = ARTIFACTS_DIR / f"trend_forecast_{state}_metadata.json"
    
    print(f"[Trend Forecast] Model path: {model_path}")
    print(f"[Trend Forecast] Model exists: {model_path.exists()}")
    
    # Auto-train if needed
    if not model_path.exists():
        print(f"[Trend Forecast] Model not found, training...")
        train_result = train_trend_forecast_model(state)
        if train_result.get("status") != "trained":
            print(f"[Trend Forecast] Training failed: {train_result}")
            return train_result
    
    # Load model using joblib
    try:
        loaded = joblib.load(model_path)
        print(f"[Trend Forecast] Model loaded successfully, type: {type(loaded)}")
    except Exception as e:
        print(f"[Trend Forecast] Failed to load model: {e}")
        return {"status": "error", "message": f"Failed to load model: {str(e)}"}
    
    # Handle both dict format (old models) and direct Prophet model format
    if isinstance(loaded, dict):
        # Old format: extract model from dictionary
        model = loaded.get('model') or loaded.get('prophet_model') or loaded
        if isinstance(model, dict):
            # Still a dict, try to find the actual model
            for key in ['model', 'prophet_model', 'forecast_model']:
                if key in model and not isinstance(model[key], dict):
                    model = model[key]
                    break
    else:
        # Direct Prophet model
        model = loaded
    
    # Load metadata if exists, otherwise create basic metadata
    if metadata_path.exists():
        with open(metadata_path, 'r') as f:
            metadata = json.load(f)
    else:
        metadata = {
            "state": state,
            "data_points": 10,
            "date_range_end": "2025-12-01"
        }
    
    print(f"[Trend Forecast] Metadata: {metadata}")
    
    # Get historical data for complete visualization
    print(f"[Trend Forecast] Fetching historical data for state: '{state}'")
    series = get_monthly_enrolment_series(state=state)
    print(f"[Trend Forecast] Historical series length: {len(series) if series else 0}")
    
    historical_data = []
    if series:
        for point in series:
            historical_data.append({
                "date": point['month'],
                "value": float(point['total_enrolment']),
                "type": "historical"
            })
    else:
        print(f"[Trend Forecast] WARNING: No historical data found for state '{state}'")
    
    # LIMIT PROJECTION: Only 3-6 months for trend visualization (not prediction)
    # This shows direction, not future capacity
    MAX_PROJECTION_MONTHS = 6
    num_months = min(MAX_PROJECTION_MONTHS, max(3, days // 30))
    
    future = model.make_future_dataframe(periods=num_months, freq='MS')
    forecast = model.predict(future)
    
    # Extract ONLY future predictions (limited to 6 months max)
    last_training_date = pd.to_datetime(metadata['date_range_end'])
    future_forecast = forecast[forecast['ds'] > last_training_date].copy()
    
    # Format predictions using TREND component
    predictions = []
    for _, row in future_forecast.iterrows():
        predictions.append({
            "date": str(row['ds'].date()),
            "value": max(0, float(row['yhat'])),
            "lower": max(0, float(row['yhat_lower'])),
            "upper": max(0, float(row['yhat_upper'])),
            "type": "forecast"
        })
    
    # Calculate trend slope and direction from the model's trend component
    if len(predictions) >= 2:
        trend_slope = (predictions[-1]['value'] - predictions[0]['value']) / len(predictions)
        trend_direction = "upward" if trend_slope > 100 else "downward" if trend_slope < -100 else "stable"
        
        # Calculate trend strength
        if abs(trend_slope) > 500:
            trend_strength = "strong"
        elif abs(trend_slope) > 200:
            trend_strength = "moderate"
        else:
            trend_strength = "weak"
    else:
        trend_slope = 0
        trend_direction = "stable"
        trend_strength = "weak"
    
    # Assess data quality and confidence
    data_points = metadata['data_points']
    if data_points >= 9:
        confidence = "medium"
        data_quality = "Acceptable (9+ months)"
    elif data_points >= 6:
        confidence = "low"
        data_quality = "Limited (6-8 months)"
    else:
        confidence = "very_low"
        data_quality = "Insufficient (<6 months)"
    
    return {
        "status": "success",
        "state": state,
        "horizon_days": days,
        "historical": historical_data,
        "forecast": predictions,  # SHORT-TERM trend projection only (3-6 months)
        "last_available_date": metadata['date_range_end'],
        "trend_slope": float(trend_slope),
        "trend_direction": trend_direction,
        "trend_analysis": {
            "direction": trend_direction,
            "slope": float(trend_slope),
            "strength": trend_strength,
            "confidence": confidence,
            "interpretation": f"Trend is {trend_direction} with {trend_strength} strength"
        },
        "data_quality": {
            "training_months": data_points,
            "quality_level": data_quality,
            "confidence": confidence,
            "warning": "Limited 2025 data (missing Jan, Feb, Aug) - trend direction only, not predictions"
        },
        "model_metadata": {
            "type": "Prophet (Trend-Only)",
            "aggregation": "Monthly",
            "training_date": metadata['training_date'],
            "training_months": metadata['data_points'],
            "date_range": f"{metadata['date_range_start']} to {metadata['date_range_end']}",
            "seasonality": "none",
            "confidence_interval": "95%",
            "projection_months": num_months,
            "note": "⚠️ TREND DIRECTION ANALYSIS ONLY - Not a prediction system. Shows directional trend, not future capacity planning values."
        }
    }


if __name__ == "__main__":
    # Test
    state = "Gujarat"
    print(f"Training trend-only forecast for {state}...")
    
    train_result = train_trend_forecast_model(state)
    print(f"Training: {train_result.get('status')}")
    
    if train_result.get('status') == 'trained':
        forecast_result = predict_trend_forecast(state, 90)
        print(f"Forecast: {forecast_result.get('status')}")
        if forecast_result.get('status') == 'success':
            print(f"\nFirst 3 predictions:")
            for pred in forecast_result['forecast'][:3]:
                print(f"  {pred['date']}: {pred['value']:.0f} (CI: {pred['lower']:.0f} - {pred['upper']:.0f})")
