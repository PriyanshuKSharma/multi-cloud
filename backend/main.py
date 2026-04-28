import logging
import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from fastapi.responses import JSONResponse

from app.api.endpoints import auth
from app.db.base import engine, Base
from app.db.migrate import ensure_user_columns, ensure_project_columns, ensure_resource_columns

from app.models import user, resource, credential, resource_inventory, blueprint

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Nebula API")

# GLOBAL ERROR LOGGER for CloudWatch
@app.middleware("http")
async def log_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        logger.exception("Unhandled server exception")
        raise e

# CORS Middleware
default_origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000",
    "https://nebula-xi-lyart.vercel.app",
    "https://nebulacommandcenter.vercel.app",
]
cors_origins_env = os.getenv("CORS_ORIGINS", "")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()] or default_origins
origin_regex = os.getenv("CORS_ORIGIN_REGEX", r"^https://([a-z0-9-]+\.)?vercel\.app$")

# Optional single-origin override for deployed frontends.
frontend_origin = os.getenv("FRONTEND_ORIGIN", "").strip()
if frontend_origin and frontend_origin not in origins:
    origins.append(frontend_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add SessionMiddleware for OAuth
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SECRET_KEY", "super-secret-key-change-this-in-prod")
)

# Include Routers
from app.api.endpoints import (
    resources, credentials, dashboard, inventory, 
    billing, blueprints, projects, deployments, assistant
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(resources.router, prefix="/resources", tags=["resources"])
app.include_router(credentials.router, prefix="/credentials", tags=["credentials"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(billing.router, prefix="/billing", tags=["billing"])
app.include_router(blueprints.router, prefix="/blueprints", tags=["blueprints"])
app.include_router(projects.router, prefix="/projects", tags=["projects"])
app.include_router(deployments.router, prefix="/deployments", tags=["deployments"])
app.include_router(assistant.router, prefix="/assistant", tags=["assistant"])

@app.get("/")
async def root():
    return {"status": "online", "message": "Welcome to the Nebula Multi-Cloud API", "version": "1.0.0"}

@app.get("/debug/celery")
async def debug_celery():
    from app.core.celery_app import celery_app
    import socket
    broker_url = celery_app.conf.broker_url
    try:
        # Extract host and port from redis://redis:6379/0
        import re
        match = re.match(r"redis://([^:/]+):?(\d+)?", broker_url)
        if match:
            host = match.group(1)
            port = int(match.group(2) or 6379)
            s = socket.socket()
            s.settimeout(2.0)
            s.connect((host, port))
            s.close()
            connection_check = "Success"
        else:
            connection_check = "Invalid URL format"
    except Exception as e:
        connection_check = f"Failed: {str(e)}"
        
    return {
        "broker_url": broker_url,
        "connection_check": connection_check
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled server exception on %s %s", request.method, request.url.path)
    return JSONResponse(status_code=500, content={"detail": str(exc)})
