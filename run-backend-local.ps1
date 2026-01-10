<#
.SYNOPSIS
    Run backend locally with venv (faster than Docker for development)
    
.DESCRIPTION
    - Starts FastAPI backend using uvicorn with hot reload
    - Connects to Redis container at localhost:6379
    - Models load from local cache (instant after first load)
    - Code changes auto-reload without restart
    
.NOTES
    Prerequisites:
    - Redis container must be running: docker-compose -f docker-compose.local.yml up redis-local -d
    - Python venv activated with all dependencies installed
#>

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Starting Backend (Local Python Venv)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Redis is running
Write-Host "[1/3] Checking Redis container..." -ForegroundColor Yellow
$redis = docker ps --filter "name=rag-redis-local" --format "{{.Names}}"
if (-not $redis) {
    Write-Host "   [ERROR] Redis container not running!" -ForegroundColor Red
    Write-Host "   Start Redis first: docker-compose -f docker-compose.local.yml up redis-local -d" -ForegroundColor Yellow
    exit 1
}
Write-Host "   [OK] Redis running: $redis" -ForegroundColor Green

# Check venv
Write-Host "[2/3] Checking Python environment..." -ForegroundColor Yellow
if (-not (Test-Path "venv/Scripts/python.exe")) {
    Write-Host "   [ERROR] Virtual environment not found!" -ForegroundColor Red
    Write-Host "   Create it first: python -m venv venv" -ForegroundColor Yellow
    exit 1
}
Write-Host "   [OK] Venv found at: venv/Scripts/python.exe" -ForegroundColor Green

# Override Redis URL for local connection
Write-Host "[3/3] Setting environment variables..." -ForegroundColor Yellow
$env:REDIS_URL = "redis://localhost:6379"
$env:DEBUG = "True"
$env:LOG_LEVEL = "INFO"
Write-Host "   [OK] REDIS_URL = $env:REDIS_URL" -ForegroundColor Green
Write-Host "   [OK] DEBUG = $env:DEBUG" -ForegroundColor Green

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Backend Starting on http://localhost:8000" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Features:" -ForegroundColor Cyan
Write-Host "  - Hot reload enabled (code changes auto-apply)" -ForegroundColor Gray
Write-Host "  - Models cached locally (fast after first load)" -ForegroundColor Gray
Write-Host "  - Connect to Redis at localhost:6379" -ForegroundColor Gray
Write-Host ""
Write-Host "Endpoints:" -ForegroundColor Cyan
Write-Host "  - API Docs: http://localhost:8000/docs" -ForegroundColor Gray
Write-Host "  - Health: http://localhost:8000/api/health" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

# Start uvicorn with hot reload
& venv/Scripts/python.exe -m uvicorn src.api.main:app `
    --host 0.0.0.0 `
    --port 8000 `
    --reload `
    --reload-dir src `
    --log-level info
