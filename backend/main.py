from fastapi import FastAPI
from app.api.endpoints import auth
from app.db.base import engine, Base

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Multi-Cloud Orchestrator API")

app.include_router(auth.router, prefix="/auth", tags=["auth"])
from app.api.endpoints import resources
app.include_router(resources.router, prefix="/resources", tags=["resources"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Multi-Cloud Orchestrator API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
