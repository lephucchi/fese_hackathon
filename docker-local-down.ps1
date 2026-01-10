# =============================================================================
# Docker Local Development - Stop Script (PowerShell)
# =============================================================================
# Stops local development stack
# =============================================================================

Write-Host "[*] Stopping Local Development Stack..." -ForegroundColor Yellow
Write-Host ""

docker-compose -f docker-compose.local.yml down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "[OK] Local stack stopped successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "[TIP] To remove volumes (reset Redis data):" -ForegroundColor Cyan
    Write-Host "   docker-compose -f docker-compose.local.yml down -v" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "[ERROR] Failed to stop services!" -ForegroundColor Red
    exit 1
}
