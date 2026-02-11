import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
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
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
