from fastapi import APIRouter
from sqlalchemy import func

import numpy as np


from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord

from backend.common.state_resolver import resolve_state
from backend.ml.common import list_districts
from backend.ml.risk.scoring import compute_state_risk
from backend.ml.risk.recommend import recommend_actions
from backend.ml.risk.district_scoring import compute_district_risk

from backend.ml.risk.biometric_district_scoring import compute_biometric_district_risk

router = APIRouter()


@router.get("/top-priority")
def top_priority(top: int = 10):
    """
    Ranked list of top risky states with recommendations.
    """
    session = SessionLocal()
    states = [x[0] for x in session.query(UIDAIRecord.state).distinct().all()]
    session.close()

    results = []
    for st in states:
        risk = compute_state_risk(st)
        if risk.get("status") != "success":
            continue

        rec = recommend_actions(st)
        if rec.get("status") != "success":
            rec = {"recommended_actions": []}

        results.append({
            "state": st,
            "risk_score": risk["risk_score"],
            "components": risk["components"],
            "recommended_actions": rec.get("recommended_actions", [])
        })

    results = sorted(results, key=lambda x: x["risk_score"], reverse=True)[:top]
    return {"status": "success", "top": top, "results": results}


@router.get("/db-summary")
def db_summary():
    """
    DB health metrics for dashboard KPIs.
    """
    session = SessionLocal()

    total_rows = session.query(func.count(UIDAIRecord.id)).scalar()
    enrol_rows = session.query(func.count(UIDAIRecord.id)).filter(UIDAIRecord.dataset_type == "ENROLMENT").scalar()
    states = session.query(func.count(func.distinct(UIDAIRecord.state))).scalar()
    districts = session.query(func.count(func.distinct(UIDAIRecord.district))).scalar()

    session.close()

    return {
        "status": "success",
        "total_rows": int(total_rows),
        "enrolment_rows": int(enrol_rows),
        "states": int(states),
        "districts": int(districts)
    }


@router.get("/state-priority")
def state_priority(state: str, top: int = 20):
    import pandas as pd

    state = resolve_state(state)
    districts = list_districts(state=state, limit=300)

    results = []
    for d in districts:
        out = compute_district_risk(state=state, district=d)
        if out.get("status") == "success":
            results.append(out)

    if not results:
        return {"status": "error", "message": "No district risks computed"}

    df = pd.DataFrame(results)

    # ✅ Z-score normalization INSIDE state
    mu = df["raw_risk"].mean()
    sd = df["raw_risk"].std()
    if sd is None or sd < 1e-9:
        sd = 1.0

    df["risk_score"] = (df["raw_risk"] - mu) / sd

    df = df.sort_values("risk_score", ascending=False).head(top)

    return {
        "status": "success",
        "state": state,
        "top": top,
        "districts_scanned": len(districts),
        "results": df.to_dict(orient="records"),
    }


@router.get("/biometric-hotspots")
def biometric_hotspots(state: str, top: int = 20):
    """
    Get biometric risk hotspots for a state with ML-powered analysis.
    Returns data matching frontend BiometricHotspots.tsx schema.
    """
    from backend.ml.data_loader import load_processed_data
    from datetime import datetime
    import numpy as np
    
    state = resolve_state(state)
    
    # Load CSV data
    try:
        df = load_processed_data(validate=False)
    except FileNotFoundError:
        return {
            "status": "error",
            "message": "CSV data not found",
            "hotspots": [],
            "avg_risk_score": 0,
            "severe_count": 0,
            "worst_district": None,
            "trend": "Stable"
        }
    
    # Filter by state (case-insensitive)
    df = df[df['state'].str.lower() == state.lower()]
    
    if df.empty:
        return {
            "status": "success",
            "state": state,
            "hotspots": [],
            "avg_risk_score": 0,
            "severe_count": 0,
            "worst_district": None,
            "trend": "Stable",
            "metadata": {
                "csv_source": "aadhaar_master_monthly.csv",
                "message": f"No data found for state: {state}"
            }
        }
    
    # Get unique districts
    districts = df['district'].unique().tolist()
    
    # Compute biometric risk for each district
    results = []
    for d in districts:
        out = compute_biometric_district_risk(state=state, district=d)
        if out.get("status") == "success":
            results.append(out)
    
    if not results:
        return {
            "status": "success",
            "state": state,
            "hotspots": [],
            "avg_risk_score": 0,
            "severe_count": 0,
            "worst_district": None,
            "trend": "Stable",
            "metadata": {
                "csv_source": "aadhaar_master_monthly.csv",
                "message": "Insufficient biometric data for ML risk computation"
            }
        }
    
    # Normalize risk scores using percentile-based approach
    raw_risks = [r["raw_risk"] for r in results]
    raw_risks_array = np.array(raw_risks)
    
    p25 = np.percentile(raw_risks_array, 25)
    p50 = np.percentile(raw_risks_array, 50)
    p75 = np.percentile(raw_risks_array, 75)
    p90 = np.percentile(raw_risks_array, 90)
    
    # Process each district with normalized scores
    hotspots = []
    for r in results:
        raw_risk = r["raw_risk"]
        
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
        
        hotspots.append({
            "district": r["district"],
            "score": round(score, 2),
            "severity": severity,
            "bio_gap_abs_mean_30": round(r["components"]["bio_gap_abs_mean_30"], 2),
            "bio_negative_gap_ratio_30": round(r["components"]["bio_negative_gap_ratio_30"] * 100, 1),  # as percentage
            "points_used": r["points_used"],
            "trend_data": r["trend_data"],
            "compare_to_avg": 0  # Will calculate below
        })
    
    # Sort by score descending
    hotspots.sort(key=lambda x: x["score"], reverse=True)
    
    # Calculate state-level metrics
    avg_risk_score = sum(h["score"] for h in hotspots) / len(hotspots) if hotspots else 0
    severe_count = sum(1 for h in hotspots if h["severity"] == "Severe")
    worst_district = {"name": hotspots[0]["district"], "score": hotspots[0]["score"]} if hotspots else None
    
    # Calculate compare_to_avg for each district
    for h in hotspots:
        h["compare_to_avg"] = round(h["score"] - avg_risk_score, 2)
    
    # Determine trend (compare recent vs older biometric data)
    try:
        # Get overall state biometric trend
        state_df = df.sort_values('month')
        if len(state_df) >= 6:
            recent = state_df.tail(3)['total_bio_updates'].mean()
            older = state_df.head(3)['total_bio_updates'].mean()
            if recent > older * 1.05:
                trend = "Improving"
            elif recent < older * 0.95:
                trend = "Worsening"
            else:
                trend = "Stable"
        else:
            trend = "Stable"
    except:
        trend = "Stable"
    
    # Limit to top N
    top_hotspots = hotspots[:top]
    
    return {
        "status": "success",
        "state": state,
        "hotspots": top_hotspots,
        "avg_risk_score": round(avg_risk_score, 2),
        "severe_count": severe_count,
        "worst_district": worst_district,
        "trend": trend,
        "metadata": {
            "csv_source": "aadhaar_master_monthly.csv",
            "biometric_columns": ["total_bio_updates"],
            "model_type": "ML-based biometric gap analysis",
            "timestamp": datetime.now().isoformat(),
            "data_lineage": "CSV → Biometric Features → ML Model → Risk Score",
            "districts_analyzed": len(districts),
            "districts_with_data": len(results)
        }
    }

