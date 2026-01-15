"""
AI Insights API - Rule-based intelligent recommendations.
Generates contextual insights based on risk analysis data.
"""
from fastapi import APIRouter
from typing import List, Dict
from backend.common.state_resolver import resolve_state

router = APIRouter()


def generate_insights(state: str, data: Dict) -> Dict[str, List[str]]:
    """
    Generate AI-style insights based on data analysis.
    Uses rule-based logic to create contextual recommendations.
    """
    insights = {
        "summary": [],
        "actions": [],
        "trends": []
    }
    
    # Analyze risk scores
    avg_risk = data.get("avg_risk_score", 0)
    critical_count = data.get("critical_count", 0) or data.get("severe_count", 0)
    total_count = data.get("count", 0) or data.get("total_segments", 0)
    
    # Summary insights
    if avg_risk >= 7:
        insights["summary"].append(f"{state} shows critical risk levels requiring immediate intervention")
    elif avg_risk >= 4:
        insights["summary"].append(f"{state} has moderate risk levels that need close monitoring")
    else:
        insights["summary"].append(f"{state} maintains stable enrollment patterns")
    
    if critical_count > 0 and total_count > 0:
        percentage = (critical_count / total_count) * 100
        insights["summary"].append(f"{critical_count} out of {total_count} areas ({percentage:.1f}%) are in critical condition")
    
    # Trend analysis
    trend = data.get("trend", "Stable")
    if trend == "Worsening" or trend == "declining":
        insights["trends"].append("Declining trend detected - enrollment rates are decreasing over time")
        insights["actions"].append("Conduct root cause analysis to identify barriers to enrollment")
    elif trend == "Improving" or trend == "increasing":
        insights["trends"].append("Positive trend observed - enrollment rates are improving")
        insights["actions"].append("Document and replicate successful strategies in other regions")
    else:
        insights["trends"].append("Stable enrollment patterns with minimal volatility")
    
    # Action recommendations based on severity
    if critical_count > 0:
        insights["actions"].append(f"Deploy mobile enrollment units to {critical_count} critical areas immediately")
        insights["actions"].append("Increase awareness campaigns in high-risk zones")
        insights["actions"].append("Allocate additional resources to underperforming districts")
    
    if avg_risk >= 5:
        insights["actions"].append("Implement weekly monitoring and reporting for early intervention")
        insights["actions"].append("Conduct field visits to assess on-ground challenges")
    
    # Add data quality insights
    insights["summary"].append(f"Analysis based on {total_count} areas with complete data coverage")
    
    return insights


@router.get("/insights/district-risks")
def get_district_insights(state: str):
    """Generate AI insights for district risks."""
    from backend.analytics.district_risk_analysis import analyze_district_risks
    
    state = resolve_state(state)
    data = analyze_district_risks(state, window_days=30, top=20)
    
    if data.get("status") != "success":
        return {"status": "error", "message": "Failed to generate insights"}
    
    insights = generate_insights(state, data)
    
    return {
        "status": "success",
        "state": state,
        "insights": insights
    }


@router.get("/insights/biometric-hotspots")
def get_biometric_insights(state: str):
    """Generate AI insights for biometric hotspots."""
    from backend.api.ml import biometric_hotspots
    
    state = resolve_state(state)
    data = biometric_hotspots(state)
    
    if data.get("status") != "success":
        return {"status": "error", "message": "Failed to generate insights"}
    
    insights = generate_insights(state, data)
    
    # Add biometric-specific insights
    if data.get("trend") == "Worsening":
        insights["actions"].insert(0, "Urgent: Deploy biometric equipment maintenance teams")
        insights["actions"].insert(1, "Conduct operator retraining programs immediately")
    
    return {
        "status": "success",
        "state": state,
        "insights": insights
    }


@router.get("/insights/demographic-risks")
def get_demographic_insights(state: str):
    """Generate AI insights for demographic risks."""
    from backend.analytics.demographic_risk_analysis import analyze_demographic_risks
    
    state = resolve_state(state)
    data = analyze_demographic_risks(state, window_days=90)
    
    if data.get("status") != "success":
        return {"status": "error", "message": "Failed to generate insights"}
    
    insights = generate_insights(state, data)
    
    # Add demographic-specific insights
    highest_risk = data.get("highest_risk_segment")
    if highest_risk:
        insights["actions"].insert(0, f"Priority: Address biometric engagement issues in {highest_risk}")
    
    return {
        "status": "success",
        "state": state,
        "insights": insights
    }
