"""
Forecast prediction module - Uses trend-only Prophet model from notebook
"""

from backend.ml.forecast.trend_forecast import predict_trend_forecast

def forecast(state: str, days: int = 30):
    """
    Generate TREND-ONLY forecast using Prophet
    Matches the notebook's approach: no seasonality, just smooth trend
    """
    if days < 1 or days > 365:
        return {"status": "error", "message": "days must be between 1 and 365"}
    
    return predict_trend_forecast(state, days)
