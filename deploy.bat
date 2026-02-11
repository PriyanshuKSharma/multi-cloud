@echo off
echo ========================================
echo Multi-Cloud Platform Deployment Script
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop.
    pause
    exit /b 1
)

echo [OK] Docker is running
echo.

REM Check if .env file exists
if not exist .env (
    echo [WARNING] .env file not found. Creating from template...
    copy .env.example .env
    echo [ACTION REQUIRED] Please edit .env file with your configuration
    echo Press any key to open .env file...
    pause >nul
    notepad .env
)

echo.
echo Choose deployment mode:
echo 1. Development (with hot reload)
echo 2. Production (optimized build)
echo.
set /p mode="Enter choice (1 or 2): "

if "%mode%"=="1" (
    echo.
    echo Starting in DEVELOPMENT mode...
    docker-compose down
    docker-compose up -d --build
    echo.
    echo ========================================
    echo Development Environment Started!
    echo ========================================
    echo Frontend: http://localhost:5173
    echo Backend API: http://localhost:8000/docs
    echo ========================================
) else if "%mode%"=="2" (
    echo.
    echo Starting in PRODUCTION mode...
    docker-compose -f docker-compose.prod.yml down
    docker-compose -f docker-compose.prod.yml up -d --build
    echo.
    echo ========================================
    echo Production Environment Started!
    echo ========================================
    echo Application: http://localhost
    echo Backend API: http://localhost/api/docs
    echo ========================================
) else (
    echo Invalid choice. Exiting...
    exit /b 1
)

echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

echo.
echo Checking service health...
docker-compose ps

echo.
echo Deployment complete!
echo.
echo To view logs: docker-compose logs -f
echo To stop: docker-compose down
echo.
pause
