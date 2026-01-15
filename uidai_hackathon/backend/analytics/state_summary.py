# State summary module
from sqlalchemy import func
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord


def get_state_metric_summary(state: str, dataset_type: str = "ENROLMENT"):
    session = SessionLocal()

    rows = (
        session.query(
            UIDAIRecord.metric_name,
            func.sum(UIDAIRecord.metric_value).label("total")
        )
        .filter(
            UIDAIRecord.state == state,
            UIDAIRecord.dataset_type == dataset_type
        )
        .group_by(UIDAIRecord.metric_name)
        .order_by(func.sum(UIDAIRecord.metric_value).desc())
        .all()
    )

    session.close()

    return [{"metric_name": r[0], "total": int(r[1])} for r in rows]
