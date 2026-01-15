# Alerts API routes
from fastapi import APIRouter
from sqlalchemy import func

from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord
from backend.alerts.alert_engine import generate_state_alert
from backend.alerts.storage import get_latest_alerts

router = APIRouter()


@router.post("/generate")
def generate_alerts(top: int = 10):
    session = SessionLocal()
    states = [x[0] for x in session.query(UIDAIRecord.state).distinct().all()]
    session.close()

    results = []
    for st in states[:top]:
        results.append(generate_state_alert(st))

    return {"status": "success", "generated": results}


@router.get("/latest")
def latest(limit: int = 50):
    return {"status": "success", "alerts": get_latest_alerts(limit)}
