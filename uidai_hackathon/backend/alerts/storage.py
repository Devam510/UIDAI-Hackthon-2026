"""
Alert storage utilities.
Handles persistence and retrieval of alerts from database or cache.
"""
from backend.db.session import SessionLocal
from backend.db.models import Alert

def save_alert(level, scope, state, district, alert_type, message):
    session = SessionLocal()

    alert = Alert(
        level=level,
        scope=scope,
        state=state,
        district=district,
        alert_type=alert_type,
        message=message,
        is_active=True
    )

    session.add(alert)
    session.commit()
    session.close()

    return True


def get_latest_alerts(limit: int = 50):
    session = SessionLocal()

    alerts = (
        session.query(Alert)
        .order_by(Alert.created_at.desc())
        .limit(limit)
        .all()
    )
    session.close()

    return [
        {
            "id": a.id,
            "created_at": str(a.created_at),
            "level": a.level,
            "scope": a.scope,
            "state": a.state,
            "district": a.district,
            "alert_type": a.alert_type,
            "message": a.message,
            "is_active": a.is_active
        }
        for a in alerts
    ]
