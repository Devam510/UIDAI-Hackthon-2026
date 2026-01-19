"""
Biometric Baseline Model Training Script
Trains ML models to predict expected biometric updates for anomaly detection.

Usage:
    python -m backend.ml.biometric.train_all_states

This will train biometric baseline models for all states in the CSV.
"""
import pandas as pd
import numpy as np
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import pickle
from datetime import datetime

from backend.ml.data_loader import load_processed_data
from backend.ml.registry import save_model
from backend.common.key_utils import slugify_key


def train_biometric_baseline_model(state: str = None, save: bool = True):
    """
    Train biometric baseline model for a state.
    
    Args:
        state: State name (None for global model)
        save: Whether to save the trained model
    
    Returns:
        Dictionary with training results
    """
    print(f"\n{'='*60}")
    print(f"Training Biometric Baseline Model")
    print(f"State: {state if state else 'GLOBAL'}")
    print(f"{'='*60}\n")
    
    # Load CSV data
    df = load_processed_data(validate=False)
    
    # Filter by state if specified
    if state:
        df = df[df['state'].str.lower() == state.lower()]
        if df.empty:
            return {
                "status": "error",
                "message": f"No data found for state: {state}"
            }
    
    # Group by month and sum biometric updates
    monthly = df.groupby('month').agg({
        'total_bio_updates': 'sum'
    }).reset_index()
    
    monthly = monthly.sort_values('month')
    monthly['month'] = pd.to_datetime(monthly['month'])
    
    if len(monthly) < 10:
        return {
            "status": "error",
            "message": f"Insufficient data: {len(monthly)} months (need at least 10)"
        }
    
    print(f"Data points: {len(monthly)} months")
    print(f"Date range: {monthly['month'].min()} to {monthly['month'].max()}")
    print(f"Biometric updates range: {monthly['total_bio_updates'].min():.0f} to {monthly['total_bio_updates'].max():.0f}")
    
    # Feature engineering
    monthly['month_num'] = monthly['month'].dt.month
    monthly['year'] = monthly['month'].dt.year
    monthly['quarter'] = monthly['month'].dt.quarter
    
    # Lag features
    monthly['lag_1'] = monthly['total_bio_updates'].shift(1)
    monthly['lag_2'] = monthly['total_bio_updates'].shift(2)
    monthly['lag_3'] = monthly['total_bio_updates'].shift(3)
    
    # Rolling features
    monthly['roll_3'] = monthly['total_bio_updates'].rolling(window=3, min_periods=1).mean()
    monthly['roll_6'] = monthly['total_bio_updates'].rolling(window=6, min_periods=1).mean()
    
    # Drop NaN rows
    monthly = monthly.dropna()
    
    if len(monthly) < 5:
        return {
            "status": "error",
            "message": f"Insufficient data after feature engineering: {len(monthly)} rows"
        }
    
    # Prepare features and target
    feature_cols = ['month_num', 'year', 'quarter', 'lag_1', 'lag_2', 'lag_3', 'roll_3', 'roll_6']
    X = monthly[feature_cols]
    y = monthly['total_bio_updates']
    
    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, shuffle=False
    )
    
    print(f"\nTraining set: {len(X_train)} months")
    print(f"Test set: {len(X_test)} months")
    
    # Train Random Forest model
    print("\nTraining Random Forest model...")
    model = RandomForestRegressor(
        n_estimators=100,
        max_depth=10,
        min_samples_split=2,
        min_samples_leaf=1,
        random_state=42,
        n_jobs=-1
    )
    
    model.fit(X_train, y_train)
    
    # Evaluate
    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    
    train_mae = mean_absolute_error(y_train, train_pred)
    test_mae = mean_absolute_error(y_test, test_pred)
    train_r2 = r2_score(y_train, train_pred)
    test_r2 = r2_score(y_test, test_pred)
    
    print(f"\n{'='*60}")
    print("Model Performance:")
    print(f"{'='*60}")
    print(f"Train MAE: {train_mae:,.2f}")
    print(f"Test MAE:  {test_mae:,.2f}")
    print(f"Train R²:  {train_r2:.4f}")
    print(f"Test R²:   {test_r2:.4f}")
    print(f"{'='*60}\n")
    
    # Feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_cols,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("Top 5 Important Features:")
    for idx, row in feature_importance.head(5).iterrows():
        print(f"  {row['feature']:15s}: {row['importance']:.4f}")
    
    # Save model
    if save:
        model_key = f"bio_expected_{slugify_key(state)}" if state else "bio_expected_global"
        save_model(model, model_key)
        print(f"\n✅ Model saved as: {model_key}")
    
    return {
        "status": "success",
        "state": state if state else "GLOBAL",
        "model_key": model_key if save else None,
        "data_points": len(monthly),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "metrics": {
            "train_mae": float(train_mae),
            "test_mae": float(test_mae),
            "train_r2": float(train_r2),
            "test_r2": float(test_r2)
        },
        "feature_importance": feature_importance.to_dict(orient='records'),
        "trained_at": datetime.now().isoformat()
    }


def train_all_states():
    """Train biometric baseline models for all states in the CSV."""
    print("\n" + "="*80)
    print("BIOMETRIC BASELINE MODEL TRAINING - ALL STATES")
    print("="*80)
    
    # Load CSV to get all states
    df = load_processed_data(validate=False)
    states = df['state'].unique().tolist()
    
    print(f"\nFound {len(states)} states in CSV")
    print(f"States: {', '.join(sorted(states)[:5])}{'...' if len(states) > 5 else ''}\n")
    
    results = []
    
    # Train global model first
    print("\n" + "="*80)
    print("TRAINING GLOBAL MODEL")
    print("="*80)
    result = train_biometric_baseline_model(state=None, save=True)
    results.append(result)
    
    # Train state-specific models
    for i, state in enumerate(sorted(states), 1):
        print(f"\n{'='*80}")
        print(f"TRAINING STATE MODEL {i}/{len(states)}")
        print(f"{'='*80}")
        result = train_biometric_baseline_model(state=state, save=True)
        results.append(result)
    
    # Summary
    print("\n" + "="*80)
    print("TRAINING SUMMARY")
    print("="*80)
    
    successful = [r for r in results if r.get("status") == "success"]
    failed = [r for r in results if r.get("status") != "success"]
    
    print(f"\n✅ Successfully trained: {len(successful)} models")
    print(f"❌ Failed: {len(failed)} models")
    
    if successful:
        print("\nSuccessful Models:")
        for r in successful:
            state_name = r.get("state", "UNKNOWN")
            test_r2 = r.get("metrics", {}).get("test_r2", 0)
            print(f"  ✅ {state_name:25s} - Test R²: {test_r2:.4f}")
    
    if failed:
        print("\nFailed Models:")
        for r in failed:
            state_name = r.get("state", "UNKNOWN")
            message = r.get("message", "Unknown error")
            print(f"  ❌ {state_name:25s} - {message}")
    
    print("\n" + "="*80)
    print("TRAINING COMPLETE!")
    print("="*80)
    
    return results


if __name__ == "__main__":
    # Train all state models
    results = train_all_states()
    
    # Save training report
    report_path = Path(__file__).parent.parent / "artifacts" / "training_reports" / f"biometric_training_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    
    import json
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Training report saved to: {report_path}")
