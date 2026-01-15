"""
Batch state summary endpoint for Home Page optimization.
Returns summary for multiple states in one API call.
"""
from fastapi import APIRouter
from backend.common.state_resolver import resolve_state
from backend.ml.data_loader import load_processed_data
from datetime import datetime
import pandas as pd

router = APIRouter()


@router.post("/state-summary-batch")
def state_summary_batch(states: list[str]):
    """
    Get summary for multiple states in one call (OPTIMIZED).
    """
    from backend.api.analytics import (_calculate_risk_from_csv, 
                                        _calculate_anomaly_from_csv,
                                        _calculate_negative_gap_ratio,
                                        _calculate_growth_from_csv)
    
    # Load CSV ONCE for all states
    try:
        df = load_processed_data(validate=False)
    except Exception as e:
        return {
            "status": "error",
            "message": f"Failed to load CSV: {str(e)}",
            "results": []
        }
    
    results = []
    
    for state in states:
        try:
            resolved_state = resolve_state(state)
            state_df = df[df['state'].str.lower() == resolved_state.lower()]
            
            if state_df.empty:
                results.append({
                    "state": state,
                    "risk_score": 0,
                    "anomaly_severity": "Low",
                    "negative_gap_ratio": "0%",
                    "forecast_growth": "+0.00",
                    "top_district": None
                })
                continue
            
            # Calculate metrics
            risk_score = _calculate_risk_from_csv(state_df)
            anomaly_severity = _calculate_anomaly_from_csv(state_df)
            negative_gap_ratio = _calculate_negative_gap_ratio(state_df)
            forecast_growth = _calculate_growth_from_csv(state_df)
            
            # Get top district
            try:
                district_totals = state_df.groupby('district')['total_enrolments'].sum()
                top_district = district_totals.idxmax() if len(district_totals) > 0 else None
            except:
                top_district = None
            
            results.append({
                "state": resolved_state,
                "risk_score": risk_score,
                "anomaly_severity": anomaly_severity,
                "negative_gap_ratio": negative_gap_ratio,
                "forecast_growth": forecast_growth,
                "top_district": top_district
            })
        except Exception as e:
            print(f"Error processing {state}: {e}")
            results.append({
                "state": state,
                "risk_score": 0,
                "anomaly_severity": "Low",
                "negative_gap_ratio": "0%",
                "forecast_growth": "+0.00",
                "top_district": None
            })
    
    # Calculate priorities from all states
    try:
        all_states = df['state'].unique().tolist()
        priorities = []
        
        for st in all_states:
            st_df = df[df['state'].str.lower() == st.lower()]
            if not st_df.empty:
                st_risk = _calculate_risk_from_csv(st_df)
                priorities.append({
                    "name": st,
                    "value": round(st_risk, 2)
                })
        
        priorities = sorted(priorities, key=lambda x: x["value"], reverse=True)[:5]
    except:
        priorities = []
    
    return {
        "status": "success",
        "results": results,
        "top_priority_states": priorities,
        "metadata": {
            "csv_source": "aadhaar_master_monthly.csv",
            "timestamp": datetime.now().isoformat()
        }
    }
