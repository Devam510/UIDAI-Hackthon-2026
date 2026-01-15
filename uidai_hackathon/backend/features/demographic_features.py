# Demographic features module
from sqlalchemy import func
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord


def demographic_update_ratio(state: str):
    """
    demo_total / enrolment_total ratio (rough indicator of update intensity)
    """
    session = SessionLocal()

    demo_total = (
        session.query(func.sum(UIDAIRecord.metric_value))
        .filter(
            UIDAIRecord.dataset_type == "DEMOGRAPHIC",
            UIDAIRecord.state == state
        )
        .scalar()
        or 0
    )

    enrol_total = (
        session.query(func.sum(UIDAIRecord.metric_value))
        .filter(
            UIDAIRecord.dataset_type == "ENROLMENT",
            UIDAIRecord.state == state,
            UIDAIRecord.metric_name.like("age_%")
        )
        .scalar()
        or 1
    )

    session.close()

    return float(demo_total) / float(enrol_total)


def top_districts_low_updates(state: str, top: int = 10):
    """
    Finds districts with lowest demographic activity.
    """
    session = SessionLocal()

    rows = (
        session.query(
            UIDAIRecord.district,
            func.sum(UIDAIRecord.metric_value).label("total_demo")
        )
        .filter(
            UIDAIRecord.dataset_type == "DEMOGRAPHIC",
            UIDAIRecord.state == state
        )
        .group_by(UIDAIRecord.district)
        .order_by(func.sum(UIDAIRecord.metric_value).asc())
        .limit(top)
        .all()
    )

    session.close()

    return [{"district": r[0], "total_demographic": int(r[1])} for r in rows]
