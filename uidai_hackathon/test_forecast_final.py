from backend.ml.forecast.trend_forecast import predict_trend_forecast

result = predict_trend_forecast('Gujarat', 30)
print(f'Status: {result.get("status")}')
print(f'Historical: {len(result.get("historical", []))}')
print(f'Forecast: {len(result.get("forecast", []))}')
