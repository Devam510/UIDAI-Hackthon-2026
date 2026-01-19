# District comparison module
from sqlalchemy import func
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord


def top_districts_by_enrolment(state: str, top: int = 10):
    session = SessionLocal()

    rows = (
        session.query(
            UIDAIRecord.district,
            func.sum(UIDAIRecord.metric_value).label("total")
        )
        .filter(
            UIDAIRecord.state == state,
            UIDAIRecord.dataset_type == "ENROLMENT",
            UIDAIRecord.metric_name.like("age_%")
        )
        .group_by(UIDAIRecord.district)
        .order_by(func.sum(UIDAIRecord.metric_value).desc())
        .limit(top)
        .all()
    )

    session.close()

    return [{"district": r[0], "total_enrolment": int(r[1])} for r in rows]
