"""
Shared risk analysis utilities for District and Biometric risk scoring.
Eliminates code duplication and provides reusable components.
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple


def normalize_risk_scores_percentile(raw_risks: List[float]) -> List[Tuple[float, str]]:
    """
    Normalize risk scores to 1-10 scale using percentile-based approach.
    
    Args:
        raw_risks: List of raw risk scores
    
    Returns:
        List of tuples (normalized_score, severity_level)
    """
    raw_risks_array = np.array(raw_risks)
    
    # Calculate percentiles
    p25 = np.percentile(raw_risks_array, 25)
    p50 = np.percentile(raw_risks_array, 50)
    p75 = np.percentile(raw_risks_array, 75)
    p90 = np.percentile(raw_risks_array, 90)
    
    normalized = []
    for raw_risk in raw_risks:
        # Map percentiles to risk scores (1-10 scale)
        if raw_risk <= p25:
            score = 1.0 + (raw_risk / p25) * 2.0 if p25 > 0 else 2.0
        elif raw_risk <= p50:
            score = 3.0 + ((raw_risk - p25) / (p50 - p25)) * 2.0 if p50 > p25 else 4.0
        elif raw_risk <= p75:
            score = 5.0 + ((raw_risk - p50) / (p75 - p50)) * 2.0 if p75 > p50 else 6.0
        elif raw_risk <= p90:
            score = 7.0 + ((raw_risk - p75) / (p90 - p75)) * 2.0 if p90 > p75 else 8.0
        else:
            score = 9.0 + min(1.0, (raw_risk - p90) / (max(raw_risks) - p90)) if max(raw_risks) > p90 else 9.5
        
        # Determine severity
        if score >= 7.0:
            severity = "Severe"
        elif score >= 4.0:
            severity = "Moderate"
        else:
            severity = "Low"
        
        normalized.append((round(score, 2), severity))
    
    return normalized


def calculate_trend_data(values: np.ndarray, target_length: int = 30) -> List[float]:
    """
    Convert monthly values to trend data array of target length.
    
    Args:
        values: Array of monthly values
        target_length: Desired length of output array (default 30)
    
    Returns:
        List of float values padded/truncated to target length
    """
    trend_data = values.tolist()
    
    if len(trend_data) > target_length:
        # Take last N values
        trend_data = trend_data[-target_length:]
    elif len(trend_data) < target_length:
        # Pad by repeating values proportionally
        days_per_month = target_length // len(trend_data)
        remainder = target_length % len(trend_data)
        daily_trend = []
        for i, monthly_val in enumerate(trend_data):
            days_for_this_month = days_per_month + (1 if i < remainder else 0)
            daily_trend.extend([monthly_val] * days_for_this_month)
        trend_data = daily_trend[:target_length]
    
    return [float(x) for x in trend_data]


def calculate_state_trend(df: pd.DataFrame, column: str = 'total_enrolments') -> str:
    """
    Calculate state-level trend (Improving/Stable/Worsening).
    
    Args:
        df: DataFrame sorted by month
        column: Column name to analyze
    
    Returns:
        Trend string: "Improving", "Stable", or "Worsening"
    """
    try:
        if len(df) >= 6:
            recent = df.tail(3)[column].mean()
            older = df.head(3)[column].mean()
            if recent > older * 1.05:
                return "Improving"
            elif recent < older * 0.95:
                return "Worsening"
            else:
                return "Stable"
        else:
            return "Stable"
    except:
        return "Stable"


def calculate_compare_to_avg(scores: List[float], avg_score: float) -> List[float]:
    """
    Calculate how each score compares to average.
    
    Args:
        scores: List of risk scores
        avg_score: Average risk score
    
    Returns:
        List of differences from average
    """
    return [round(score - avg_score, 2) for score in scores]


def calculate_summary_metrics(hotspots: List[Dict]) -> Dict:
    """
    Calculate summary metrics for a list of hotspots.
    
    Args:
        hotspots: List of district/hotspot dictionaries with 'score' and 'severity'
    
    Returns:
        Dictionary with avg_risk_score, severe_count, worst_district
    """
    if not hotspots:
        return {
            "avg_risk_score": 0,
            "severe_count": 0,
            "worst_district": None
        }
    
    avg_risk_score = sum(h["score"] for h in hotspots) / len(hotspots)
    severe_count = sum(1 for h in hotspots if h["severity"] == "Severe")
    worst_district = {
        "name": hotspots[0]["district"],
        "score": hotspots[0]["score"]
    } if hotspots else None
    
    return {
        "avg_risk_score": round(avg_risk_score, 2),
        "severe_count": severe_count,
        "worst_district": worst_district
    }


def calculate_statistical_risk(values: np.ndarray) -> Dict[str, float]:
    """
    Calculate statistical risk metrics from time series values.
    
    Args:
        values: Array of time series values
    
    Returns:
        Dictionary with gap_abs_mean, negative_gap_ratio, gap_trend, raw_risk
    """
    # Calculate gap metrics (statistical approach)
    mean_val = values.mean()
    std_val = values.std()
    
    # Gap from mean
    gap_abs_mean = std_val if std_val > 0 else 0
    
    # Negative gap ratio (values below mean)
    negative_gap_ratio = (values < mean_val).mean()
    
    # Trend (simple linear)
    if len(values) >= 2:
        gap_trend = (values[-1] - values[0]) / len(values)
    else:
        gap_trend = 0
    
    # Calculate raw risk score (statistical formula)
    raw_risk = np.log1p(gap_abs_mean) + (negative_gap_ratio * 10) + (abs(gap_trend) / 1000)
    
    return {
        "gap_abs_mean": float(gap_abs_mean),
        "negative_gap_ratio": float(negative_gap_ratio),
        "gap_trend": float(gap_trend),
        "raw_risk": float(raw_risk)
    }
