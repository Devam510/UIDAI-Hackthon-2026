"""
Demographic Risk Model - ML-based Biometric Engagement Detection.

Uses Isolation Forest for anomaly detection on biometric update patterns.
FIXED VERSION - Complete implementation with proper error handling.
"""

import pandas as pd
import numpy as np
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from datetime import datetime

# Lazy imports to avoid cold-start issues
_sklearn_loaded = False
_model_cache = {}

logger = logging.getLogger(__name__)

# Model storage path - backend/ml/risk -> backend -> data/models
MODEL_DIR = Path(__file__).parent.parent / "data" / "models"


def _ensure_sklearn():
    """Lazy load sklearn to improve cold-start performance."""
    global _sklearn_loaded
    if not _sklearn_loaded:
        try:
            from sklearn.ensemble import IsolationForest
            from sklearn.preprocessing import StandardScaler
            _sklearn_loaded = True
        except ImportError:
            logger.warning("sklearn not available, using statistical fallback")
    return _sklearn_loaded


def engineer_features(state_df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features for demographic risk model from state data.
    
    Features:
    - bio_rate: Average monthly biometric updates per district
    - bio_trend: Linear regression slope of bio updates over time
    - bio_volatility: Coefficient of variation (std/mean)
    - deviation: Percentage deviation from state average
    - enrol_bio_ratio: Ratio of enrolments to bio updates
    
    Args:
        state_df: DataFrame filtered for a specific state
        
    Returns:
        DataFrame with engineered features per district
    """
    if state_df.empty:
        return pd.DataFrame(columns=[
            'district', 'bio_rate', 'bio_trend', 'bio_volatility', 
            'deviation', 'enrol_bio_ratio'
        ])
    
    # Ensure required columns exist
    required_cols = ['district', 'month', 'total_bio_updates', 'total_enrolments']
    for col in required_cols:
        if col not in state_df.columns:
            if col == 'total_bio_updates':
                state_df[col] = 0
            elif col == 'total_enrolments':
                state_df[col] = 0
    
    # Calculate state-level average bio rate
    state_avg_bio = state_df.groupby('month')['total_bio_updates'].sum().mean()
    if state_avg_bio == 0:
        state_avg_bio = 1  # Prevent division by zero
    
    features_list = []
    
    for district in state_df['district'].unique():
        district_df = state_df[state_df['district'] == district].copy()
        
        if district_df.empty:
            continue
        
        # Sort by month for time-series calculations
        district_df = district_df.sort_values('month')
        
        # Monthly aggregates
        monthly_bio = district_df.groupby('month')['total_bio_updates'].sum()
        monthly_enrol = district_df.groupby('month')['total_enrolments'].sum()
        
        # Feature 1: Bio rate (average monthly bio updates)
        bio_rate = monthly_bio.mean() if len(monthly_bio) > 0 else 0
        
        # Feature 2: Bio trend (slope of linear regression)
        if len(monthly_bio) >= 3:
            x = np.arange(len(monthly_bio))
            try:
                slope, _ = np.polyfit(x, monthly_bio.values, 1)
                bio_trend = slope
            except:
                bio_trend = 0
        else:
            bio_trend = 0
        
        # Feature 3: Bio volatility (coefficient of variation)
        bio_mean = monthly_bio.mean()
        bio_std = monthly_bio.std()
        bio_volatility = (bio_std / bio_mean) if bio_mean > 0 else 0
        
        # Feature 4: Deviation from state average (percentage)
        deviation = ((bio_rate - state_avg_bio) / state_avg_bio) * 100 if state_avg_bio > 0 else 0
        
        # Feature 5: Enrolment to bio ratio
        total_enrol = monthly_enrol.sum()
        total_bio = monthly_bio.sum()
        enrol_bio_ratio = (total_enrol / total_bio) if total_bio > 0 else 0
        
        features_list.append({
            'district': district,
            'bio_rate': float(bio_rate),
            'bio_trend': float(bio_trend),
            'bio_volatility': float(bio_volatility),
            'deviation': float(deviation),
            'enrol_bio_ratio': float(enrol_bio_ratio)
        })
    
    return pd.DataFrame(features_list)


def train_demographic_risk_model(state: str = "All") -> Dict:
    """
    Train Isolation Forest model for demographic risk detection.
    
    Args:
        state: State to train on (default "All" for all states)
        
    Returns:
        Dictionary with training metadata
    """
    from backend.ml.data_loader import load_processed_data
    
    logger.info(f"[Demographic Risk Model] Training for state: {state}")
    
    # Load data from database
    try:
        df = load_processed_data(validate=False)
    except Exception as e:
        raise ValueError(f"Failed to load data: {e}")
    
    if df.empty:
        raise ValueError("No data available for training")
    
    # Filter by state if specified
    if state and state.lower() != "all":
        state_df = df[df['state'].str.lower() == state.lower()].copy()
        if state_df.empty:
            raise ValueError(f"No data found for state: {state}")
    else:
        state_df = df.copy()
    
    # Engineer features
    features_df = engineer_features(state_df)
    
    if features_df.empty or len(features_df) < 3:
        raise ValueError(f"Insufficient data for training: {len(features_df)} districts")
    
    # Prepare feature matrix
    feature_cols = ['bio_rate', 'bio_trend', 'bio_volatility', 'deviation', 'enrol_bio_ratio']
    X = features_df[feature_cols].fillna(0).values
    
    # Check for sklearn
    if not _ensure_sklearn():
        # Return statistical-based metadata if sklearn unavailable
        return {
            "demographic_model_name": "StatisticalFallback",
            "model_version": "1.0",
            "training_date": datetime.now().strftime('%Y-%m-%d'),
            "state": state,
            "districts_trained": len(features_df),
            "features": feature_cols,
            "sklearn_available": False
        }
    
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest
    model = IsolationForest(
        n_estimators=100,
        contamination=0.2,  # Expect ~20% anomalies
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_scaled)
    
    # Cache model in memory (for this session)
    cache_key = f"demographic_{state.lower()}"
    _model_cache[cache_key] = {
        "model": model,
        "scaler": scaler,
        "features": feature_cols,
        "trained_at": datetime.now()
    }
    
    # Save model to disk (optional, for persistence)
    try:
        MODEL_DIR.mkdir(parents=True, exist_ok=True)
        import joblib
        joblib.dump(model, MODEL_DIR / f"demographic_risk_{state.lower()}.joblib")
        joblib.dump(scaler, MODEL_DIR / f"demographic_scaler_{state.lower()}.joblib")
    except Exception as e:
        logger.warning(f"Could not save model to disk: {e}")
    
    metadata = {
        "demographic_model_name": "IsolationForest_BiometricEngagement",
        "model_version": "2.0",
        "training_date": datetime.now().strftime('%Y-%m-%d'),
        "state": state,
        "districts_trained": len(features_df),
        "features": feature_cols,
        "sklearn_available": True
    }
    
    logger.info(f"✅ Model trained successfully for {state}: {len(features_df)} districts")
    
    return metadata


def load_demographic_risk_model(state: str = "All") -> Tuple[Any, Any, Dict]:
    """
    Load trained demographic risk model.
    
    Args:
        state: State for which to load model
        
    Returns:
        Tuple of (model, scaler, metadata)
        
    Raises:
        FileNotFoundError: If model not found
    """
    cache_key = f"demographic_{state.lower()}"
    
    # Check in-memory cache first
    if cache_key in _model_cache:
        cached = _model_cache[cache_key]
        return cached["model"], cached["scaler"], {
            "demographic_model_name": "IsolationForest_BiometricEngagement",
            "model_version": "2.0",
            "training_date": cached["trained_at"].strftime('%Y-%m-%d'),
            "features": cached["features"]
        }
    
    # Try to load from disk
    model_path = MODEL_DIR / f"demographic_risk_{state.lower()}.joblib"
    scaler_path = MODEL_DIR / f"demographic_scaler_{state.lower()}.joblib"
    
    if model_path.exists() and scaler_path.exists():
        try:
            import joblib
            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            
            metadata = {
                "demographic_model_name": "IsolationForest_BiometricEngagement",
                "model_version": "2.0",
                "training_date": datetime.now().strftime('%Y-%m-%d'),
                "features": ['bio_rate', 'bio_trend', 'bio_volatility', 'deviation', 'enrol_bio_ratio']
            }
            
            # Cache for future use
            _model_cache[cache_key] = {
                "model": model,
                "scaler": scaler,
                "features": metadata["features"],
                "trained_at": datetime.now()
            }
            
            return model, scaler, metadata
        except Exception as e:
            logger.warning(f"Failed to load model from disk: {e}")
    
    raise FileNotFoundError(f"No trained model found for state: {state}")


def predict_demographic_risks(state: str, auto_train: bool = True) -> pd.DataFrame:
    """
    Predict demographic risks for a state using ML model.
    
    Falls back to statistical scoring if ML is unavailable.
    
    Args:
        state: State name to analyze
        auto_train: If True, train model if not found
        
    Returns:
        DataFrame with district-level risk predictions
    """
    from backend.ml.data_loader import load_processed_data
    
    # Load data from database
    try:
        df = load_processed_data(validate=False)
    except Exception as e:
        raise ValueError(f"Failed to load data: {e}")
    
    if df.empty:
        raise ValueError("No data available for prediction")
    
    # Filter by state
    state_df = df[df['state'].str.lower() == state.lower()].copy()
    
    if state_df.empty:
        raise ValueError(f"No data found for state: {state}")
    
    # Engineer features
    features_df = engineer_features(state_df)
    
    if features_df.empty:
        raise ValueError(f"No features could be engineered for state: {state}")
    
    # Prepare feature matrix
    feature_cols = ['bio_rate', 'bio_trend', 'bio_volatility', 'deviation', 'enrol_bio_ratio']
    X = features_df[feature_cols].fillna(0).values
    
    # Check sklearn availability
    sklearn_available = _ensure_sklearn()
    
    if sklearn_available:
        try:
            # Try to load existing model
            try:
                model, scaler, _ = load_demographic_risk_model(state)
            except FileNotFoundError:
                if auto_train:
                    logger.info(f"No model found for {state}, training new model...")
                    train_demographic_risk_model(state)
                    model, scaler, _ = load_demographic_risk_model(state)
                else:
                    raise
            
            # Scale and predict
            X_scaled = scaler.transform(X)
            anomaly_scores = model.decision_function(X_scaled)
            anomaly_labels = model.predict(X_scaled)
            
            # Convert anomaly scores to risk scores (1-10 scale)
            min_score = anomaly_scores.min()
            max_score = anomaly_scores.max()
            
            if max_score - min_score > 0:
                normalized = (anomaly_scores - min_score) / (max_score - min_score)
                # Invert: lower anomaly score = higher risk
                risk_scores = 10 - (normalized * 9)  # Scale to 1-10
            else:
                risk_scores = np.full(len(anomaly_scores), 5.0)
            
            # Add predictions to features
            features_df['risk_score'] = risk_scores
            features_df['is_anomaly'] = (anomaly_labels == -1)
            features_df['anomaly_score'] = anomaly_scores
            
            return features_df
            
        except Exception as e:
            logger.warning(f"ML prediction failed, using statistical fallback: {e}")
    
    # Statistical fallback (no sklearn needed)
    logger.info("Using statistical risk scoring (sklearn unavailable or failed)")
    
    # Calculate risk scores based on feature analysis
    risk_scores = []
    for _, row in features_df.iterrows():
        # Risk factors:
        # 1. Low bio_rate = higher risk
        # 2. Negative bio_trend = higher risk
        # 3. High volatility = higher risk
        # 4. Large negative deviation = higher risk
        # 5. High enrol_bio_ratio = higher risk (more enrolments, fewer bio updates)
        
        bio_rate_risk = 10 - min(10, max(0, row['bio_rate'] / 1000))  # Normalize
        trend_risk = 5 - min(5, max(-5, row['bio_trend'] / 100))  # Slope impact
        volatility_risk = min(3, row['bio_volatility'] * 3)  # Cap at 3
        deviation_risk = 2 if row['deviation'] < -20 else (1 if row['deviation'] < 0 else 0)
        ratio_risk = min(2, row['enrol_bio_ratio'] / 100) if row['enrol_bio_ratio'] > 10 else 0
        
        total_risk = bio_rate_risk * 0.3 + trend_risk * 0.25 + volatility_risk * 0.2 + deviation_risk * 0.15 + ratio_risk * 0.1
        risk_scores.append(min(10, max(1, total_risk + 2)))  # Shift to 2-10 range
    
    features_df['risk_score'] = risk_scores
    features_df['is_anomaly'] = features_df['risk_score'] > 6
    features_df['anomaly_score'] = -features_df['risk_score']  # Negative for consistency
    
    return features_df


if __name__ == "__main__":
    # Test training
    print("=" * 60)
    print("Testing Demographic Risk Model Training")
    print("=" * 60)
    
    try:
        metadata = train_demographic_risk_model("Gujarat")
        print("\nTraining Metadata:")
        print(json.dumps(metadata, indent=2))
    except Exception as e:
        print(f"Training failed (expected if no data): {e}")
    
    print("\n" + "=" * 60)
    print("Testing Prediction")
    print("=" * 60)
    
    try:
        predictions = predict_demographic_risks("Gujarat", auto_train=True)
        print(f"\nPredictions for {len(predictions)} districts:")
        print(predictions[['district', 'risk_score', 'is_anomaly']].head(10))
        print("\n✓ Model training and prediction successful!")
    except Exception as e:
        print(f"Prediction failed (expected if no data): {e}")
