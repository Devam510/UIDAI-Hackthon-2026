from backend.db.session import SessionLocal
from backend.db.models import UIDAIRecord
from sqlalchemy import func

def main():
    session = SessionLocal()

    total = session.query(func.count(UIDAIRecord.id)).scalar()
    enrol = session.query(func.count(UIDAIRecord.id)).filter(UIDAIRecord.dataset_type=="ENROLMENT").scalar()
    states = session.query(UIDAIRecord.state).distinct().limit(20).all()

    session.close()

    print("Total records:", total)
    print("ENROLMENT records:", enrol)
    print("Sample states:", states)

if __name__ == "__main__":
    main()
