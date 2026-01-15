# Configuration settings module
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "UIDAI Trends Platform"
    DEBUG: bool = True

    # DB (you are using SQLite now)
    DATABASE_URL: str = "sqlite:///uidai.db"

    # ML / thresholds
    RISK_THRESHOLD_MEDIUM: float = 1.0
    RISK_THRESHOLD_HIGH: float = 1.5

    class Config:
        env_file = ".env"


settings = Settings()
