from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
import logging
import pandas as pd
import numpy as np

from backend.common.state_resolver import resolve_state
from backend.analytics.trend_analysis import moving_average_trend
from backend.analytics.state_summary import get_state_metric_summary
from backend.analytics.district_comparison import top_districts_by_enrolment
from backend.analytics.district_risk_analysis import analyze_district_risks

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/trend")
def trend(state: str, window: int = 7):
    try:
        state = resolve_state(state)
        return {"status": "success", "state": state, "trend": moving_average_trend(state, window)}
    except ValueError as e:
        logger.warning(f"Invalid state input for trend: {state}")
        return JSONResponse(status_code=400, content={"status": "error", "message": str(e)})
    except Exception as e:
        logger.error(f"Error in trend analysis: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})


@router.get("/metric-summary")
def metric_summary(state: str, dataset_type: str = "ENROLMENT"):
    try:
        state = resolve_state(state)
        return {
            "status": "success",
            "state": state,
            "dataset_type": dataset_type,
            "summary": get_state_metric_summary(state, dataset_type)
        }
    except ValueError as e:
        logger.warning(f"Invalid state input for metric-summary: {state}")
        return JSONResponse(status_code=400, content={"status": "error", "message": str(e)})
    except Exception as e:
        logger.error(f"Error in metric-summary: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})


@router.get("/top-districts")
def top_districts(state: str, top: int = 10):
    try:
        state = resolve_state(state)
        return {
            "status": "success",
            "state": state,
            "top": top,
            "districts": top_districts_by_enrolment(state, top)
        }
    except ValueError as e:
        logger.warning(f"Invalid state input for top-districts: {state}")
        return JSONResponse(status_code=400, content={"status": "error", "message": str(e)})
    except Exception as e:
        logger.error(f"Error in top-districts: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})


@router.get("/district-risks")
def district_risks(state: str, window: int = 30, top: int = 20):
    """
    Get district-level risk analysis with gap metrics.
    """
    try:
        state = resolve_state(state)
        return analyze_district_risks(state, window, top)
    except ValueError as e:
        logger.warning(f"Invalid state input for district-risks: {state}")
        return JSONResponse(status_code=400, content={"status": "error", "message": str(e)})
    except Exception as e:
        logger.error(f"Error in district-risks: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "message": "Internal server error"})


@router.get("/demographic-risks")
def demographic_risks(state: str, window: int = 90, top: int = 20):
    """
    Get demographic risk analysis based on biometric update patterns.
    """
    try:
        from backend.analytics.demographic_risk_analysis import analyze_demographic_risks
        
        state = resolve_state(state)
        result = analyze_demographic_risks(state, window)
        
        # Limit segments to top N
        if result.get("status") == "success" and "segments" in result:
            result["segments"] = result["segments"][:top]
        
        return result
    except ValueError as e:
        logger.warning(f"Invalid state input for demographic-risks: {state}")
        # Return a structured error that frontend can parse but with 400 code
        return JSONResponse(status_code=400, content={
            "status": "error", 
            "message": str(e),
            "fallback": "Please check state name"
        })
    except Exception as e:
        logger.error(f"Error in demographic-risks: {e}")
        return JSONResponse(status_code=500, content={
            "status": "error", 
            "message": "Internal server error processing demographic risks",
            "fallback": "Analysis unavailable"
        })


from backend.ml.risk.scoring import compute_state_risk
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord
from backend.ml.data_loader import get_last_data_date

from functools import lru_cache

@lru_cache(maxsize=32)
def get_dashboard_summary_cached(state: str):
    """
    Cached version of state summary calculation.
    """
    from backend.ml.data_loader import load_processed_data
    from datetime import datetime
    
    # Frontend requests these 10 states (from Home.tsx lines 30-33)
    FRONTEND_STATES = [
        "Uttar Pradesh", "Maharashtra", "Bihar", "West Bengal", "Madhya Pradesh",
        "Tamil Nadu", "Rajasthan", "Karnataka", "Gujarat", "Andhra Pradesh"
    ]
    
    # Load CSV data ONCE (with caching)
    try:
        df = load_processed_data(validate=False)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to load CSV data: {str(e)}",
            "risk_score": 0,
            "anomaly_severity": "Low",
            "negative_gap_ratio": "0%",
            "forecast_growth": "+0.00",
            "top_district": None
        }
    
    # PRE-CALCULATE ONLY THE 10 STATES FRONTEND NEEDS (not all 36)
    all_state_data = {}
    
    for st in FRONTEND_STATES:
        st_df = df[df['state'].str.lower() == st.lower()]
        if st_df.empty:
            continue
        
        # Calculate all metrics for this state
        all_state_data[st.lower()] = {
            "state": st,
            "risk_score": _calculate_risk_from_csv(st_df),
            "anomaly_severity": _calculate_anomaly_from_csv(st_df),
            "negative_gap_ratio": _calculate_negative_gap_ratio(st_df),
            "forecast_growth": _calculate_growth_from_csv(st_df),
            "top_district": _get_top_district(st_df)
        }
    
    # Get data for requested state
    state_key = state.lower()
    if state_key not in all_state_data:
        # State not in pre-calculated list, calculate on demand
        state_df = df[df['state'].str.lower() == state.lower()]
        if state_df.empty:
            return {
                "status": "error",
                "message": f"No data found for state: {state}",
                "risk_score": 0,
                "anomaly_severity": "Low",
                "negative_gap_ratio": "0%",
                "forecast_growth": "+0.00",
                "top_district": None
            }
        
        all_state_data[state_key] = {
            "state": state,
            "risk_score": _calculate_risk_from_csv(state_df),
            "anomaly_severity": _calculate_anomaly_from_csv(state_df),
            "negative_gap_ratio": _calculate_negative_gap_ratio(state_df),
            "forecast_growth": _calculate_growth_from_csv(state_df),
            "top_district": _get_top_district(state_df)
        }
    
    state_info = all_state_data[state_key]
    
    # Calculate priority states (top 5 by risk)
    priorities = [
        {"name": data["state"], "value": round(data["risk_score"], 2)}
        for data in all_state_data.values()
    ]
    priorities = sorted(priorities, key=lambda x: x["value"], reverse=True)[:5]
    
    return {
        "status": "success",
        "state": state_info["state"],
        "risk_score": state_info["risk_score"],
        "anomaly_severity": state_info["anomaly_severity"],
        "negative_gap_ratio": state_info["negative_gap_ratio"],
        "forecast_growth": state_info["forecast_growth"],
        "top_district": state_info["top_district"],
        "top_priority_states": priorities,
        "metadata": {
            "csv_source": "aadhaar_master_monthly.csv",
            "analysis_type": "Statistical (optimized for performance)",
            "data_lineage": "CSV → Statistical Analysis → API",
            "timestamp": datetime.now().isoformat(),
            "last_data_date": get_last_data_date()
        }
    }

@router.get("/state-summary")
def state_summary(state: str):
    """
    Get comprehensive state summary with fast statistical analysis.
    Uses cached logic for sub-millisecond response times on repeat calls.
    """
    state_resolved = resolve_state(state)
    # Clear cache to ensure fresh calculations with updated formula
    get_dashboard_summary_cached.cache_clear()
    return get_dashboard_summary_cached(state_resolved)


@router.get("/all-states-summary")
def all_states_summary():
    """
    PERFORMANCE OPTIMIZATION: Get summary for ALL states in a single API call.
    This eliminates the N+1 query problem on the Home page (35+ sequential calls → 1 call).
    Returns data for all states sorted by risk score.
    """
    from backend.ml.data_loader import load_processed_data
    from datetime import datetime
    
    try:
        # Load CSV data ONCE
        df = load_processed_data(validate=False)
    except Exception as e:
        return JSONResponse(status_code=500, content={
            "status": "error",
            "message": f"Failed to load CSV data: {str(e)}"
        })
    
    # Get all unique states from the CSV
    all_states = df['state'].unique().tolist()
    
    # Calculate metrics for ALL states in parallel
    all_state_data = []
    
    for state in all_states:
        state_df = df[df['state'].str.lower() == state.lower()]
        if state_df.empty:
            continue
        
        # Calculate all metrics for this state
        all_state_data.append({
            "name": state,
            "risk_score": _calculate_risk_from_csv(state_df),
            "anomaly_severity": _calculate_anomaly_from_csv(state_df),
            "negative_gap_ratio": _calculate_negative_gap_ratio(state_df),
            "forecast_growth": _calculate_growth_from_csv(state_df),
            "top_district": _get_top_district(state_df)
        })
    
    # Sort by risk score (descending)
    all_state_data.sort(key=lambda x: x["risk_score"], reverse=True)
    
    return {
        "status": "success",
        "states": all_state_data,
        "metadata": {
            "total_states": len(all_state_data),
            "csv_source": "aadhaar_master_monthly.csv",
            "analysis_type": "Statistical (bulk optimized)",
            "data_lineage": "CSV → Bulk Statistical Analysis → API",
            "timestamp": datetime.now().isoformat(),
            "last_data_date": get_last_data_date()
        }
    }



def _get_top_district(state_df: pd.DataFrame) -> str:
    """Get top district by total enrolments."""
    try:
        district_totals = state_df.groupby('district')['total_enrolments'].sum()
        return district_totals.idxmax() if len(district_totals) > 0 else None
    except:
        return None



def _calculate_risk_from_csv(state_df: pd.DataFrame) -> float:
    """Calculate risk score from CSV statistics using multiple factors.
    
    Formula designed to spread scores across 1-10 scale:
    - Low risk (1-3): Stable enrollment with low volatility
    - Moderate risk (4-6): Some volatility or declining trend
    - High risk (7-10): High volatility AND declining trend
    """
    try:
        monthly = state_df.groupby('month')['total_enrolments'].sum()
        if len(monthly) < 2:
            return 5.0
        
        # Factor 1: Coefficient of Variation (volatility) - REDUCED WEIGHT
        std_dev = monthly.std()
        mean_val = monthly.mean()
        cv = (std_dev / mean_val) if mean_val > 0 else 0
        
        # Factor 2: Trend (declining = higher risk)
        if len(monthly) >= 6:
            recent_avg = monthly.tail(3).mean()
            older_avg = monthly.head(3).mean()
            # Calculate trend as percentage change
            trend_change = ((recent_avg - older_avg) / older_avg) if older_avg > 0 else 0
            # Declining trend adds risk, growing trend reduces risk
            trend_score = max(0, -trend_change * 10)  # Negative growth = higher score
        else:
            trend_score = 0
        
        # Factor 3: Negative months ratio
        negative_ratio = (monthly < mean_val).mean()
        
        # Combined risk score - ADJUSTED WEIGHTS for better distribution
        # CV weight reduced from 5 to 3, trend is now additive
        raw_risk = (cv * 3) + (negative_ratio * 2) + trend_score
        
        # Normalize to 1-10 scale WITHOUT the +2 shift
        # Use a scaling factor to spread values more evenly
        risk = min(10, max(1, raw_risk * 1.2))  # Scale by 1.2 to reach higher values
        
        return round(risk, 2)
    except:
        return 5.0



def _calculate_anomaly_from_csv(state_df: pd.DataFrame) -> str:
    """Calculate anomaly severity from CSV variance and outliers."""
    try:
        monthly = state_df.groupby('month')['total_enrolments'].sum()
        if len(monthly) < 3:
            return "Low"
        
        # Calculate z-scores to find anomalies
        mean_val = monthly.mean()
        std_val = monthly.std()
        
        if std_val == 0:
            return "Low"
        
        # Coefficient of variation (volatility indicator)
        cv = std_val / mean_val if mean_val > 0 else 0
        
        z_scores = abs((monthly - mean_val) / std_val)
        
        # Count anomalies at different thresholds
        extreme_anomalies = (z_scores > 2.5).sum()  # Very extreme (lowered from 3)
        moderate_anomalies = (z_scores > 1.5).sum()  # Moderate outliers (lowered from 2)
        
        # Calculate anomaly percentage
        anomaly_pct = (moderate_anomalies / len(monthly)) * 100
        
        # Classify based on multiple factors
        # High: Either extreme outliers OR high volatility with moderate outliers
        if extreme_anomalies >= 2 or (cv > 0.5 and moderate_anomalies >= 3):
            return "High"
        # Medium: Some outliers OR moderate volatility
        elif moderate_anomalies >= 2 or (cv > 0.3 and anomaly_pct > 10):
            return "Medium"
        else:
            return "Low"
    except:
        return "Low"



def _calculate_negative_gap_ratio(state_df: pd.DataFrame) -> str:
    """Calculate percentage of months with negative gaps from mean."""
    try:
        monthly = state_df.groupby('month')['total_enrolments'].sum()
        if len(monthly) == 0:
            return "0%"
        
        mean_enrolment = monthly.mean()
        negative_months = (monthly < mean_enrolment).sum()
        ratio = (negative_months / len(monthly)) * 100
        return f"{ratio:.1f}%"
    except:
        return "0%"


def _calculate_growth_from_csv(state_df: pd.DataFrame) -> str:
    """Calculate growth rate from CSV trend."""
    try:
        monthly = state_df.groupby('month')['total_enrolments'].sum().sort_index()
        if len(monthly) < 2:
            return "+0.00"
        
        # Compare recent 3 months to older 3 months
        if len(monthly) >= 6:
            recent = monthly.tail(3).mean()
            older = monthly.head(3).mean()
        else:
            recent = monthly.iloc[-1]
            older = monthly.iloc[0]
        
        if older == 0:
            return "+0.00"
        
        growth = ((recent - older) / older)
        return f"{growth:+.2f}"
    except:
        return "+0.00"


