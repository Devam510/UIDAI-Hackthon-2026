"""
Demographic Risk ML Model - Isolation Forest based risk detection.

This module trains a REAL ML model from processed CSV data to identify
demographic segments at risk based on biometric engagement patterns.

Data Flow:
    CSV → Feature Engineering → Isolation Forest → Risk Scores → API → UI

Features:
    - bio_rate: Average monthly biometric updates per district
    - bio_trend: Linear regression slope of bio updates over time
    - bio_volatility: Coefficient of variation in bio updates
    - deviation: Percentage deviation from state average
    - enrol_bio_ratio: Ratio of enrolments to bio updates

Model: Isolation Forest (unsupervised anomaly detection)
    - Detects districts with anomalous biometric engagement patterns
    - Anomaly scores converted to risk scores (1-10 scale)
    - Higher anomaly = Higher risk = Lower engagement
"""

import pandas as pd
import numpy as np
import pickle
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, Optional, Tuple
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

# Paths
PROJECT_ROOT = Path(__file__).resolve().parents[3]
PROCESSED_CSV = PROJECT_ROOT / "data" / "processed" / "aadhaar_master_monthly.csv"
ARTIFACTS_DIR = PROJECT_ROOT / "backend" / "ml" / "artifacts"
ARTIFACTS_DIR.mkdir(parents=True, exist_ok=True)

MODEL_PATH = ARTIFACTS_DIR / "demographic_risk_model.pkl"
SCALER_PATH = ARTIFACTS_DIR / "demographic_risk_scaler.pkl"
METADATA_PATH = ARTIFACTS_DIR / "demographic_risk_metadata.json"


def engineer_features(state_df: pd.DataFrame) -> pd.DataFrame:
    """
    Engineer features from raw CSV data for each district.
    
    Args:
        state_df: DataFrame filtered for a specific state
        
    Returns:
        DataFrame with engineered features per district
    """
    features = []
    state_avg_bio = state_df.groupby('month')['total_bio_updates'].sum().mean()
    
    for district in state_df['district'].unique():
        district_df = state_df[state_df['district'] == district].copy()
        
        # Sort by month
        district_df = district_df.sort_values('month')
        monthly_bio = district_df.groupby('month')['total_bio_updates'].sum()
        monthly_enrol = district_df.groupby('month')['total_enrolments'].sum()
        
        if len(monthly_bio) < 2:
            continue
        
        # Feature 1: Bio update rate (average)
        bio_rate = monthly_bio.mean()
        
        # Feature 2: Bio update trend (slope)
        x = np.arange(len(monthly_bio))
        bio_trend = np.polyfit(x, monthly_bio.values, 1)[0] if len(monthly_bio) >= 2 else 0
        
        # Feature 3: Bio update volatility (coefficient of variation)
        bio_volatility = (monthly_bio.std() / monthly_bio.mean()) if monthly_bio.mean() > 0 else 0
        
        # Feature 4: Deviation from state average
        district_avg_bio = monthly_bio.mean()
        deviation = ((district_avg_bio - state_avg_bio) / state_avg_bio * 100) if state_avg_bio > 0 else 0
        
        # Feature 5: Enrolment to bio update ratio
        total_enrol = monthly_enrol.sum()
        total_bio = monthly_bio.sum()
        enrol_bio_ratio = (total_enrol / total_bio) if total_bio > 0 else 0
        
        features.append({
            'district': district,
            'bio_rate': bio_rate,
            'bio_trend': bio_trend,
            'bio_volatility': bio_volatility,
            'deviation': deviation,
            'enrol_bio_ratio': enrol_bio_ratio
        })
    
    return pd.DataFrame(features)


def train_demographic_risk_model(state: str = "Gujarat") -> Dict:
    """
    Train Isolation Forest model for demographic risk detection.
    
    Args:
        state: State name to train on (default: Gujarat for demo)
        
    Returns:
        Dictionary with training metadata
    """
    print(f"[Demographic Risk Model] Training for state: {state}")
    
    # Load CSV data
    df = pd.read_csv(PROCESSED_CSV)
    df['month'] = pd.to_datetime(df['month'])
    
    # Filter by state
    state_df = df[df['state'].str.lower() == state.lower()].copy()
    
    if state_df.empty:
        raise ValueError(f"No data found for state: {state}")
    
    print(f"[Demographic Risk Model] Loaded {len(state_df)} rows from CSV")
    
    # Engineer features
    features_df = engineer_features(state_df)
    
    if features_df.empty:
        raise ValueError(f"No features could be engineered for state: {state}")
    
    print(f"[Demographic Risk Model] Engineered features for {len(features_df)} districts")
    
    # Prepare feature matrix
    feature_cols = ['bio_rate', 'bio_trend', 'bio_volatility', 'deviation', 'enrol_bio_ratio']
    X = features_df[feature_cols].values
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train Isolation Forest
    model = IsolationForest(
        contamination=0.2,  # Expect 20% of districts to be anomalous
        random_state=42,
        n_estimators=100
    )
    model.fit(X_scaled)
    
    print(f"[Demographic Risk Model] Model trained successfully")
    
    # Save model artifacts
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    
    with open(SCALER_PATH, 'wb') as f:
        pickle.dump(scaler, f)
    
    # Save metadata
    metadata = {
        "csv_source": "aadhaar_master_monthly.csv",
        "demographic_model_name": "IsolationForest_BiometricEngagement",
        "model_version": "2.0",
        "training_date": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        "training_state": state,
        "rows_used": len(state_df),
        "districts_analyzed": len(features_df),
        "features": feature_cols,
        "data_lineage": "CSV → Feature Engineering → IsolationForest → Risk Scores → API",
        "contamination": 0.2,
        "n_estimators": 100
    }
    
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"[Demographic Risk Model] Artifacts saved to {ARTIFACTS_DIR}")
    
    return metadata


def load_demographic_risk_model() -> Tuple[IsolationForest, StandardScaler, Dict]:
    """
    Load trained model, scaler, and metadata.
    
    Returns:
        Tuple of (model, scaler, metadata)
    """
    if not MODEL_PATH.exists():
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. "
            "Please train the model first using train_demographic_risk_model()"
        )
    
    with open(MODEL_PATH, 'rb') as f:
        model = pickle.load(f)
    
    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)
    
    with open(METADATA_PATH, 'r') as f:
        metadata = json.load(f)
    
    return model, scaler, metadata


def predict_demographic_risks(state: str, auto_train: bool = True) -> pd.DataFrame:
    """
    Predict demographic risks for all districts in a state.
    
    Args:
        state: State name
        auto_train: If True, train model if it doesn't exist
        
    Returns:
        DataFrame with risk predictions per district
    """
    # Load or train model
    try:
        model, scaler, metadata = load_demographic_risk_model()
    except FileNotFoundError:
        if auto_train:
            print(f"[Demographic Risk Model] Model not found, training...")
            train_demographic_risk_model(state)
            model, scaler, metadata = load_demographic_risk_model()
        else:
            raise
    
    # Load CSV data
    df = pd.read_csv(PROCESSED_CSV)
    df['month'] = pd.to_datetime(df['month'])
    
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
    X = features_df[feature_cols].values
    
    # Scale and predict
    X_scaled = scaler.transform(X)
    anomaly_scores = model.decision_function(X_scaled)  # Lower = more anomalous
    anomaly_labels = model.predict(X_scaled)  # -1 = anomaly, 1 = normal
    
    # Convert anomaly scores to risk scores (1-10 scale)
    # Normalize anomaly scores to 0-1 range, then scale to 1-10
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


if __name__ == "__main__":
    # Test training
    print("=" * 60)
    print("Testing Demographic Risk Model Training")
    print("=" * 60)
    
    metadata = train_demographic_risk_model("Gujarat")
    print("\nTraining Metadata:")
    print(json.dumps(metadata, indent=2))
    
    print("\n" + "=" * 60)
    print("Testing Prediction")
    print("=" * 60)
    
    predictions = predict_demographic_risks("Gujarat", auto_train=False)
    print(f"\nPredictions for {len(predictions)} districts:")
    print(predictions[['district', 'risk_score', 'is_anomaly']].head(10))
    
    print("\n✓ Model training and prediction successful!")
