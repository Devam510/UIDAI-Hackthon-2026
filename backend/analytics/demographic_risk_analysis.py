"""
Demographic Risk Analysis using ML-based Biometric Engagement Detection.

This module uses a TRAINED Isolation Forest model to identify demographic
segments at risk based on biometric update patterns.

Data Flow:
    CSV → ML Model (Isolation Forest) → Risk Predictions → API → Frontend

Model Features:
    - bio_rate: Average monthly biometric updates
    - bio_trend: Linear regression slope over time
    - bio_volatility: Coefficient of variation
    - deviation: Percentage deviation from state average
    - enrol_bio_ratio: Enrolment to bio update ratio

Segments: District-level (used as demographic proxy)
Risk Scoring: ML-based anomaly detection (1-10 scale)
"""

import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime

from backend.ml.data_loader import get_last_data_date, load_processed_data


def load_demographic_data(state: str) -> pd.DataFrame:
    """Load and filter processed CSV for demographic analysis."""
    # Load data from database (zero file dependency)
    try:
        df = load_processed_data(validate=False)
    except Exception as e:
        # Return empty DF on error so we handle it gracefully upstream
        return pd.DataFrame(columns=[
            "state", "district", "month", 
            "total_enrolments", "total_demo_updates", "total_bio_updates"
        ])

    if df.empty:
        return df
        
    # Filter by state
    state_df = df[df['state'].str.lower() == state.lower()].copy()
    
    return state_df


def classify_severity(risk_score: float) -> str:
    """Classify risk severity based on ML-predicted risk score."""
    if risk_score >= 7:
        return "Severe"
    elif risk_score >= 4:
        return "Moderate"
    else:
        return "Low"


def get_trend_direction(district_df: pd.DataFrame) -> str:
    """Determine trend direction from bio updates."""
    try:
        monthly = district_df.groupby('month')['total_bio_updates'].sum().sort_index()
        if len(monthly) < 3:
            return "stable"
        
        x = np.arange(len(monthly))
        slope = np.polyfit(x, monthly.values, 1)[0]
        
        if slope > monthly.mean() * 0.05:
            return "improving"
        elif slope < -monthly.mean() * 0.05:
            return "declining"
        else:
            return "stable"
    except:
        return "stable"


def calculate_deviation_from_state(district_bio: float, state_avg: float) -> float:
    """Calculate percentage deviation from state average."""
    if state_avg == 0:
        return 0.0
    deviation = ((district_bio - state_avg) / state_avg) * 100
    return round(deviation, 1)


def generate_recommendations(segment: Dict) -> List[str]:
    """Generate actionable recommendations based on ML risk profile."""
    recommendations = []
    
    if segment['severity_level'] == "Severe":
        recommendations.append("Deploy mobile biometric update units immediately")
        recommendations.append("Conduct awareness campaigns on biometric update importance")
        recommendations.append("Investigate barriers to biometric updates in this segment")
    elif segment['severity_level'] == "Moderate":
        recommendations.append("Schedule regular biometric update drives")
        recommendations.append("Monitor trend closely for early intervention")
    else:
        recommendations.append("Maintain current engagement strategies")
        recommendations.append("Share best practices with lower-performing segments")
    
    if segment['enrolment_trend'] == "declining":
        recommendations.append("Urgent: Reverse declining trend through targeted outreach")
    
    return recommendations


def _statistical_fallback_analysis(state: str, state_df: pd.DataFrame) -> Dict:
    """
    Pure statistical fallback when ML model fails or no data.
    Ensures the demographic page NEVER crashes.
    """
    import logging
    logger = logging.getLogger(__name__)
    logger.info(f"Using statistical fallback for state: {state}")
    
    if state_df.empty:
        # Return valid but empty response structure
        return {
            "status": "success",
            "state": state,
            "window_days": 90,
            "total_segments": 0,
            "critical_segments": 0,
            "avg_risk_score": 0.0,
            "highest_risk_segment": None,
            "segments": [],
            "metadata": {
                "csv_source": "database",
                "demographic_model_name": "StatisticalFallback",
                "model_version": "1.0",
                "training_date": datetime.now().strftime('%Y-%m-%d'),
                "rows_used": 0,
                "districts_analyzed": 0,
                "features": [],
                "data_lineage": "No Data Available",
                "analysis_basis": "No data available for analysis",
                "last_data_date": datetime.now().strftime('%Y-%m-%d')
            }
        }
    
    # Calculate state averages
    state_avg_bio = state_df.groupby('month')['total_bio_updates'].sum().mean()
    if state_avg_bio == 0:
        state_avg_bio = 1
    
    segments = []
    
    for district in state_df['district'].unique():
        district_df = state_df[state_df['district'] == district]
        
        # Calculate basic metrics
        monthly_bio = district_df.groupby('month')['total_bio_updates'].sum()
        monthly_enrol = district_df.groupby('month')['total_enrolments'].sum()
        
        if monthly_bio.sum() == 0:
            continue  # Skip districts with no bio data
        
        # Calculate risk score using statistical method
        bio_rate = monthly_bio.mean()
        bio_std = monthly_bio.std() if len(monthly_bio) > 1 else 0
        bio_cv = (bio_std / bio_rate) if bio_rate > 0 else 0
        deviation = ((bio_rate - state_avg_bio) / state_avg_bio) * 100 if state_avg_bio > 0 else 0
        
        # Risk scoring: lower bio rate + high volatility + negative deviation = higher risk
        risk_score = 5.0  # Base risk
        risk_score += min(2, bio_cv * 2)  # Volatility factor
        risk_score -= min(2, bio_rate / 10000)  # Higher bio rate = lower risk
        if deviation < -20:
            risk_score += 1.5
        elif deviation < 0:
            risk_score += 0.5
        
        risk_score = min(10, max(1, risk_score))
        
        # Get trend
        trend = get_trend_direction(district_df)
        severity = classify_severity(risk_score)
        
        # Build trend data
        monthly_sorted = monthly_bio.sort_index()
        trend_data = []
        for month, value in monthly_sorted.items():
            try:
                trend_data.append({
                    "month": month.strftime('%Y-%m') if hasattr(month, 'strftime') else str(month)[:7],
                    "value": int(value)
                })
            except:
                pass
        
        segment = {
            "demographic_group": district,
            "risk_score": round(risk_score, 2),
            "enrolment_trend": trend,
            "deviation_from_state_avg": round(deviation, 1),
            "severity_level": severity,
            "trend_data": trend_data[-12:],
            "recommendations": generate_recommendations({
                'severity_level': severity,
                'enrolment_trend': trend
            })
        }
        segments.append(segment)
    
    # Sort by risk
    segments = sorted(segments, key=lambda x: x['risk_score'], reverse=True)
    
    total_segments = len(segments)
    critical_segments = len([s for s in segments if s['severity_level'] == 'Severe'])
    avg_risk = np.mean([s['risk_score'] for s in segments]) if segments else 0
    highest_risk = segments[0] if segments else None
    
    return {
        "status": "success",
        "state": state,
        "window_days": 90,
        "total_segments": total_segments,
        "critical_segments": critical_segments,
        "avg_risk_score": round(avg_risk, 2),
        "highest_risk_segment": highest_risk['demographic_group'] if highest_risk else None,
        "segments": segments,
        "metadata": {
            "csv_source": "database",
            "demographic_model_name": "StatisticalFallback",
            "model_version": "1.0",
            "training_date": datetime.now().strftime('%Y-%m-%d'),
            "rows_used": len(state_df),
            "districts_analyzed": total_segments,
            "features": ["bio_rate", "volatility", "deviation"],
            "data_lineage": "Database → Statistical Analysis → API → UI",
            "analysis_basis": "Statistical risk scoring (ML fallback)",
            "last_data_date": get_last_data_date()
        }
    }


def analyze_demographic_risks(state: str, window_days: int = 90) -> Dict:
    """
    Analyze demographic risks using TRAINED ML MODEL.
    
    Uses Isolation Forest to detect anomalous biometric engagement patterns.
    Falls back to statistical analysis if ML fails.
    
    Args:
        state: State name
        window_days: Time window (for compatibility, not used in ML model)
        
    Returns:
        Dictionary with risk analysis results and metadata
    """
    import logging
    logger = logging.getLogger(__name__)
    
    state_df = load_demographic_data(state)
    
    # If no data, return empty but valid response
    if state_df.empty:
        logger.warning(f"No data found for state: {state}, returning empty response")
        return _statistical_fallback_analysis(state, state_df)
    
    try:
        # Try ML model predictions
        from backend.ml.risk.demographic_risk_model import predict_demographic_risks
        predictions_df = predict_demographic_risks(state, auto_train=True)
        
        # Calculate state average for deviation calculation
        state_avg_bio = state_df.groupby('month')['total_bio_updates'].sum().mean()
        
        # Build segments from ML predictions
        segments = []
        
        for _, row in predictions_df.iterrows():
            district = row['district']
            risk_score = round(row['risk_score'], 2)
            
            # Get district data for additional metrics
            district_df = state_df[state_df['district'] == district]
            
            # Get trend direction
            trend = get_trend_direction(district_df)
            
            # Get deviation from state average
            district_avg_bio = district_df.groupby('month')['total_bio_updates'].sum().mean()
            deviation = calculate_deviation_from_state(district_avg_bio, state_avg_bio)
            
            # Classify severity
            severity = classify_severity(risk_score)
            
            # Get trend data for sparkline
            monthly_bio = district_df.groupby('month')['total_bio_updates'].sum().sort_index()
            trend_data = []
            for month, value in monthly_bio.items():
                try:
                    trend_data.append({
                        "month": month.strftime('%Y-%m') if hasattr(month, 'strftime') else str(month)[:7],
                        "value": int(value)
                    })
                except:
                    pass
            
            # Skip districts with no biometric data (all zeros)
            total_bio_updates = sum(d['value'] for d in trend_data)
            if total_bio_updates == 0:
                continue  # Skip this district
            
            segment = {
                "demographic_group": district,
                "risk_score": risk_score,
                "enrolment_trend": trend,
                "deviation_from_state_avg": deviation,
                "severity_level": severity,
                "trend_data": trend_data[-12:],  # Last 12 months
                "recommendations": generate_recommendations({
                    'severity_level': severity,
                    'enrolment_trend': trend
                })
            }
            
            segments.append(segment)
        
        # Sort by risk score (highest first)
        segments = sorted(segments, key=lambda x: x['risk_score'], reverse=True)
        
        # Calculate summary stats
        total_segments = len(segments)
        critical_segments = len([s for s in segments if s['severity_level'] == 'Severe'])
        avg_risk = np.mean([s['risk_score'] for s in segments]) if segments else 0
        highest_risk = segments[0] if segments else None
        
        # Load model metadata
        from backend.ml.risk.demographic_risk_model import load_demographic_risk_model
        try:
            _, _, model_metadata = load_demographic_risk_model(state)
        except:
            model_metadata = {
                "demographic_model_name": "IsolationForest_BiometricEngagement",
                "model_version": "2.0",
                "training_date": datetime.now().strftime('%Y-%m-%d')
            }
        
        return {
            "status": "success",
            "state": state,
            "window_days": window_days,
            "total_segments": total_segments,
            "critical_segments": critical_segments,
            "avg_risk_score": round(avg_risk, 2),
            "highest_risk_segment": highest_risk['demographic_group'] if highest_risk else None,
            "segments": segments,
            "metadata": {
                "csv_source": "database",
                "demographic_model_name": model_metadata.get("demographic_model_name", "IsolationForest"),
                "model_version": model_metadata.get("model_version", "2.0"),
                "training_date": model_metadata.get("training_date", datetime.now().strftime('%Y-%m-%d')),
                "rows_used": len(state_df),
                "districts_analyzed": total_segments,
                "features": model_metadata.get("features", ["bio_rate", "bio_trend", "bio_volatility", "deviation", "enrol_bio_ratio"]),
                "data_lineage": "Database → Feature Engineering → IsolationForest → Risk Scores → API → UI",
                "analysis_basis": "ML-based anomaly detection on biometric engagement patterns",
                "last_data_date": get_last_data_date()
            }
        }
        
    except Exception as e:
        # ML failed - use statistical fallback instead of returning error
        logger.warning(f"ML model failed for {state}, using statistical fallback: {e}")
        return _statistical_fallback_analysis(state, state_df)

