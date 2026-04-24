from mangum import Mangum
from app.db.base import Base, engine
from main import app

# Ensure tables exist (Lambda warm-up)
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    print(f"DB Init Error: {e}")

# This is the entry point for AWS Lambda
handler = Mangum(app, lifespan="off")
