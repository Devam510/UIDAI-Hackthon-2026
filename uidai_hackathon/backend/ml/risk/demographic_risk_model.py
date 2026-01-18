# ... (existing imports)
from backend.ml.data_loader import load_processed_data

# ... (existing code)

def train_demographic_risk_model(state: str = "Gujarat") -> Dict:
    # ...
    print(f"[Demographic Risk Model] Training for state: {state}")
    
    # Load data from database
    try:
        df = load_processed_data(validate=False)
    except Exception as e:
        raise ValueError(f"Failed to load data: {e}")

    # ... (rest of function)

def predict_demographic_risks(state: str, auto_train: bool = True) -> pd.DataFrame:
    # ...
    # Load data from database
    try:
        df = load_processed_data(validate=False)
    except Exception as e:
        raise ValueError(f"Failed to load data: {e}")
    # ... (rest of function)    
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
