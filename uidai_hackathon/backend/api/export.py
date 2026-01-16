"""
Export API endpoints for CSV and PDF downloads.
"""
from fastapi import APIRouter, Response
from fastapi.responses import StreamingResponse
import pandas as pd
import io
from datetime import datetime

from backend.common.state_resolver import resolve_state
from backend.analytics.district_risk_analysis import analyze_district_risks
from backend.analytics.demographic_risk_analysis import analyze_demographic_risks
from backend.ml.data_loader import load_processed_data

router = APIRouter()


@router.get("/csv/district-risks")
def export_district_risks_csv(state: str, window: int = 30):
    """Export district risks data as CSV."""
    state = resolve_state(state)
    
    # Get data from analysis
    result = analyze_district_risks(state, window, top=100)
    
    if result.get("status") != "success" or not result.get("districts"):
        return Response(content="No data available", media_type="text/plain")
    
    # Convert to DataFrame
    districts_data = []
    for d in result["districts"]:
        districts_data.append({
            "District": d["district"],
            "Risk Score": d["risk_score"],
            "Severity": d["severity_level"],
            "Gap (Abs Mean)": d["gap_abs_mean"],
            "Negative Gap Ratio (%)": d["negative_gap_ratio"],
            "Total Enrollment": d["total_enrolment"]
        })
    
    df = pd.DataFrame(districts_data)
    
    # Create CSV in memory
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    # Generate filename
    filename = f"district_risks_{state}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/csv/biometric-hotspots")
def export_biometric_hotspots_csv(state: str):
    """Export biometric hotspots data as CSV."""
    from backend.api.ml import biometric_hotspots
    
    state = resolve_state(state)
    result = biometric_hotspots(state)
    
    if result.get("status") != "success" or not result.get("hotspots"):
        return Response(content="No data available", media_type="text/plain")
    
    # Convert to DataFrame
    hotspots_data = []
    for h in result["hotspots"]:
        hotspots_data.append({
            "District": h["district"],
            "Risk Score": h["score"],
            "Severity": h["severity"],
            "Bio Gap (Abs Mean)": h["bio_gap_abs_mean_30"],
            "Bio Negative Gap Ratio (%)": h["bio_negative_gap_ratio_30"],
            "Compare to Avg": h["compare_to_avg"]
        })
    
    df = pd.DataFrame(hotspots_data)
    
    # Create CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    filename = f"biometric_hotspots_{state}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/csv/demographic-risks")
def export_demographic_risks_csv(state: str, window: int = 90):
    """Export demographic risks data as CSV."""
    state = resolve_state(state)
    result = analyze_demographic_risks(state, window)
    
    if result.get("status") != "success" or not result.get("segments"):
        return Response(content="No data available", media_type="text/plain")
    
    # Convert to DataFrame
    segments_data = []
    for s in result["segments"]:
        segments_data.append({
            "Segment": s["demographic_group"],
            "Risk Score": s["risk_score"],
            "Severity": s["severity_level"],
            "Trend": s["enrolment_trend"],
            "Deviation from State Avg (%)": s["deviation_from_state_avg"]
        })
    
    df = pd.DataFrame(segments_data)
    
    # Create CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    filename = f"demographic_risks_{state}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/csv/forecast")
def export_forecast_csv(state: str, days: int = 180):
    """Export forecast data as CSV."""
    from backend.ml.forecast.predict import forecast
    
    state = resolve_state(state)
    result = forecast(state, days)
    
    if result.get("status") != "success" or not result.get("forecast"):
        return Response(content="No data available", media_type="text/plain")
    
    # Convert to DataFrame - using correct field names from forecast API
    forecast_data = []
    for f in result["forecast"]:
        forecast_data.append({
            "Date": f["date"],
            "Predicted Enrollment": f["value"],  # Changed from "predicted_total_enrolment"
            "Lower Bound (95% CI)": f["lower"],  # Changed from "lower_bound"
            "Upper Bound (95% CI)": f["upper"]   # Changed from "upper_bound"
        })
    
    df = pd.DataFrame(forecast_data)
    
    # Create CSV
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    
    filename = f"enrollment_forecast_{state}_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
