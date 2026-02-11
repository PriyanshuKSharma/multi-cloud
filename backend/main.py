from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import auth
from app.db.base import engine, Base

from app.models import user, resource, credential
from app.models import resource_inventory  # Import new models

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Multi-Cloud Orchestrator API")

# CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
from app.api.endpoints import resources, credentials, dashboard, inventory, billing
app.include_router(resources.router, prefix="/resources", tags=["resources"])
app.include_router(credentials.router, prefix="/credentials", tags=["credentials"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])

@app.get("/")
def read_root():
    return {"message": "Welcome to the Multi-Cloud Orchestrator API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
