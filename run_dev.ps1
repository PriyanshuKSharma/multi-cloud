# Multi-Cloud Orchestrator - Local Dev Launcher

Write-Host "🚀 Starting Nebula Multi-Cloud Environment..." -ForegroundColor Cyan

# 1. Start Infrastructure (DB + Redis)
Write-Host "1. Starting Database & Redis (Docker)..." -ForegroundColor Yellow
docker-compose up -d db redis
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to start Docker containers. Make sure Docker Desktop is running."
    exit 1
}

# 2. Setup Backend Environment
Write-Host "2. Setting up Backend..." -ForegroundColor Yellow
Set-Location backend

# Check for venv
if (-not (Test-Path "venv")) {
    Write-Host "   Creating Python virtual environment..."
    python -m venv venv
}

# Activate venv
.\venv\Scripts\Activate.ps1

# Install deps
Write-Host "   Installing dependencies..."
pip install -r requirements.txt | Out-Null

# Create .env for local dev if missing
if (-not (Test-Path ".env")) {
    Write-Host "   Creating local .env file..."
    "DATABASE_URL=postgresql://user:password@localhost:5432/multicloud" | Out-File .env -Encoding utf8
    "REDIS_URL=redis://localhost:6379/0" | Out-File -Append .env -Encoding utf8
    "SECRET_KEY=dev-secret-key" | Out-File -Append .env -Encoding utf8
}

# 3. Launch Backend API
Write-Host "3. Launching Backend API (New Window)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; uvicorn main:app --reload --host 0.0.0.0 --port 8000"

# 4. Launch Celery Worker
Write-Host "4. Launching Celery Worker (New Window)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; $env:OBJC_DISABLE_INITIALIZE_FORK_SAFETY='YES'; celery -A app.worker.celery_app worker --loglevel=info -P gevent"

# Note: -P gevent or pool=solr is often needed on Windows for Celery, or just basic solo pool
# Let's try 'solo' pool for Windows compatibility if gevent isn't installed
# Updating command to use 'solo' pool which is safer for Windows dev
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; .\venv\Scripts\Activate.ps1; celery -A app.worker.celery_app worker --loglevel=info --pool=solo"

# 5. Launch Frontend
Write-Host "5. Launching Frontend (New Window)..." -ForegroundColor Green
Set-Location ..\frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm install; npm run dev"

Write-Host "✨ All services launched! Check the pop-up windows." -ForegroundColor Cyan
Write-Host "   Backend: http://localhost:8000"
Write-Host "   Frontend: http://localhost:5173"
