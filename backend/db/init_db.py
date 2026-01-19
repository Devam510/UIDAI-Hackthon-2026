from backend.db.base import Base
from backend.db.session import engine
from backend.db import models

Base.metadata.create_all(bind=engine)
print("Database initialized")
