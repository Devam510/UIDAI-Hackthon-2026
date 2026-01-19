# Enrolment features module
from sqlalchemy import func
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord

def enrolment_growth(state, days=30):
    session = SessionLocal()

    rows = (
        session.query(
            UIDAIRecord.date,
            func.sum(UIDAIRecord.metric_value)
        )
        .filter(
            UIDAIRecord.dataset_type == "ENROLMENT",
            UIDAIRecord.state == state
        )
        .group_by(UIDAIRecord.date)
        .order_by(UIDAIRecord.date.desc())
        .limit(days)
        .all()
    )

    session.close()

    if len(rows) < 2:
        return 0

    latest = rows[0][1]
    oldest = rows[-1][1]

    return (latest - oldest) / max(oldest, 1)
