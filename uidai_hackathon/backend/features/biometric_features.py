# Biometric features module
from sqlalchemy import func
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord

def biometric_failure_rate(state):
    session = SessionLocal()

    value = (
        session.query(func.avg(UIDAIRecord.metric_value))
        .filter(
            UIDAIRecord.dataset_type == "BIOMETRIC",
            UIDAIRecord.state == state
        )
        .scalar()
    )

    session.close()
    return value or 0

