# Database models module
from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from backend.db.base import Base

class UIDAIRecord(Base):
    __tablename__ = "uidai_records"

    id = Column(Integer, primary_key=True)
    dataset_type = Column(String, index=True)
    date = Column(Date)
    state = Column(String, index=True)
    district = Column(String, index=True)
    pincode = Column(String)
    metric_name = Column(String, index=True)
    metric_value = Column(Integer)
    source_file = Column(String)
    created_at = Column(DateTime, server_default=func.now())

from sqlalchemy import Boolean

class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True)
    created_at = Column(DateTime, server_default=func.now())

    level = Column(String, index=True)          # LOW / MEDIUM / HIGH
    scope = Column(String, index=True)          # STATE / DISTRICT
    state = Column(String, index=True)
    district = Column(String, nullable=True)

    alert_type = Column(String, index=True)     # GAP_ANOMALY / HIGH_RISK / FORECAST_SPIKE
    message = Column(String)

    is_active = Column(Boolean, default=True)
