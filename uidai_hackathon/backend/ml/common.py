from sqlalchemy import func
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord


def get_total_enrolment_series(state: str = None, district: str = None):
    session = SessionLocal()
        # ✅ normalize filters (PERMANENT)
    if state:
        state = " ".join(str(state).strip().split()).title()
    if district:
        district = " ".join(str(district).strip().split()).title()


    q = (
        session.query(
            UIDAIRecord.date.label("date"),
            func.sum(UIDAIRecord.metric_value).label("total_enrolment")
        )
        .filter(
            UIDAIRecord.dataset_type == "ENROLMENT",
            UIDAIRecord.metric_name.like("age_%")
        )
    )

    if state:
        q = q.filter(UIDAIRecord.state == state)
    if district:
        q = q.filter(UIDAIRecord.district == district)

    rows = (
        q.group_by(UIDAIRecord.date)
         .order_by(UIDAIRecord.date.asc())
         .all()
    )

    session.close()
    return [{"date": r.date, "total_enrolment": int(r.total_enrolment)} for r in rows]


def get_total_biometric_series(state: str = None, district: str = None):
    """
    Bio total = sum(metrics where metric_name like 'bio_%'
    """
    session = SessionLocal()
        # ✅ normalize filters (PERMANENT)
    if state:
        state = " ".join(str(state).strip().split()).title()
    if district:
        district = " ".join(str(district).strip().split()).title()


    q = (
        session.query(
            UIDAIRecord.date.label("date"),
            func.sum(UIDAIRecord.metric_value).label("total_biometric")
        )
        .filter(
            UIDAIRecord.dataset_type == "BIOMETRIC",
            UIDAIRecord.metric_name.like("bio_%")
        )
    )

    if state:
        q = q.filter(UIDAIRecord.state == state)
    if district:
        q = q.filter(UIDAIRecord.district == district)

    rows = (
        q.group_by(UIDAIRecord.date)
         .order_by(UIDAIRecord.date.asc())
         .all()
    )

    session.close()
    return [{"date": r.date, "total_biometric": int(r.total_biometric)} for r in rows]


def list_districts(state: str, limit: int = 300):
    session = SessionLocal()

    rows = (
        session.query(UIDAIRecord.district, func.count(UIDAIRecord.id).label("cnt"))
        .filter(UIDAIRecord.state == state)
        .group_by(UIDAIRecord.district)
        .order_by(func.count(UIDAIRecord.id).desc())
        .limit(limit)
        .all()
    )

    session.close()
    return [" ".join(str(r[0]).strip().split()).title() for r in rows if r[0]]

from sqlalchemy import func
from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord


def list_biometric_districts(state: str, limit: int = 300):
    session = SessionLocal()

    rows = (
        session.query(UIDAIRecord.district, func.count(UIDAIRecord.id).label("cnt"))
        .filter(
            UIDAIRecord.dataset_type == "BIOMETRIC",
            UIDAIRecord.state == state,
            UIDAIRecord.district != None
        )
        .group_by(UIDAIRecord.district)
        .order_by(func.count(UIDAIRecord.id).desc())
        .limit(limit)
        .all()
    )

    session.close()
    return [r[0] for r in rows if r[0]]
