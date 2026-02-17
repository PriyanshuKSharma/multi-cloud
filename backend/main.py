import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import JSONResponse
from app.api.endpoints import auth
from app.db.base import engine, Base
from app.db.migrate import ensure_user_columns, ensure_project_columns, ensure_resource_columns

from app.models import user, resource, credential
from app.models import resource_inventory  # Import new models
from app.models import blueprint

# Create tables
Base.metadata.create_all(bind=engine)
ensure_user_columns()
ensure_project_columns()
ensure_resource_columns()

app = FastAPI(title="Nebula API")
logger = logging.getLogger(__name__)

# CORS Middleware
default_origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://nebula-xi-lyart.vercel.app",
]
cors_origins_env = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()] or default_origins

# Optional single-origin override for deployed frontends.
frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip()
if frontend_origin and frontend_origin not in origins:
    origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=os.getenv("CORS_ORIGIN_REGEX"),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add SessionMiddleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "super-secret-key-change-this-in-prod")
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
from app.api.endpoints import resources, credentials, dashboard, inventory, billing, blueprints, projects, deployments
app.include_router(resources.router, prefix="/resources", tags=["resources"])
app.include_router(credentials.router, prefix="/credentials", tags=["credentials"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(blueprints.router, prefix="/blueprints", tags=["blueprints"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(deployments.router, prefix="/deployments", tags=["deployments"])


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": str(exc)})

@app.get("/")
def read_root():
    return {"message": "Welcome to the Multi-Cloud Orchestrator API"}

@app.get("/health")
def health_check():
    return {"status": "ok"}
