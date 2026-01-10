# =============================================================================
# Docker Local Development - Start Script (PowerShell)
# =============================================================================
# Starts local development stack with hot-reload enabled
# Separate from production docker-compose.yml
# =============================================================================

Write-Host "[*] Starting Local Development Stack..." -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "[!] .env file not found!" -ForegroundColor Red
    Write-Host "[>] Please copy .env.example to .env and fill in values:" -ForegroundColor Yellow
    Write-Host "   Copy-Item .env.example .env" -ForegroundColor Gray
    exit 1
}

# Check if Docker is running
try {
    docker info | Out-Null
} catch {
    Write-Host "[!] Docker is not running!" -ForegroundColor Red
    Write-Host "[>] Please start Docker Desktop first" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] Prerequisites check passed" -ForegroundColor Green
Write-Host ""

# Stop and remove existing local containers
Write-Host "[*] Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose -f docker-compose.local.yml down 2>$null

Write-Host ""
Write-Host "[*] Building and starting services..." -ForegroundColor Cyan
docker-compose -f docker-compose.local.yml up --build -d

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host "[SUCCESS] Local Development Stack Started!" -ForegroundColor Green
    Write-Host "=" * 70 -ForegroundColor Green
    Write-Host ""
    Write-Host "Services:" -ForegroundColor Cyan
    Write-Host "   - Backend API:  http://localhost:8000" -ForegroundColor White
    Write-Host "   - API Docs:     http://localhost:8000/docs" -ForegroundColor White
    Write-Host "   - Frontend:     http://localhost:3000" -ForegroundColor White
    Write-Host "   - Redis:        localhost:6379" -ForegroundColor White
    Write-Host ""
    Write-Host "View Logs:" -ForegroundColor Cyan
    Write-Host "   docker-compose -f docker-compose.local.yml logs -f" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Stop Stack:" -ForegroundColor Cyan
    Write-Host "   docker-compose -f docker-compose.local.yml down" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Hot Reload:" -ForegroundColor Cyan
    Write-Host "   - Backend: Edit src/ files - auto reload" -ForegroundColor Gray
    Write-Host "   - Frontend: Edit frontend/src/ - auto refresh" -ForegroundColor Gray
    Write-Host ""
    Write-Host "=" * 70 -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to start services!" -ForegroundColor Red
    Write-Host "[>] Check logs with:" -ForegroundColor Yellow
    Write-Host "   docker-compose -f docker-compose.local.yml logs" -ForegroundColor Gray
    exit 1
}
