# =============================================================================
# Docker Local Development - Logs Viewer (PowerShell)
# =============================================================================
# View logs from local development stack
# Usage:
#   .\docker-local-logs.ps1           # All services
#   .\docker-local-logs.ps1 backend   # Backend only
#   .\docker-local-logs.ps1 frontend  # Frontend only
# =============================================================================

param(
    [string]$Service = ""
)

Write-Host "[*] Viewing Local Development Logs..." -ForegroundColor Cyan
Write-Host ""

if ($Service) {
    Write-Host "[*] Following logs for: $Service-local" -ForegroundColor Yellow
    docker-compose -f docker-compose.local.yml logs -f "$Service-local"
} else {
    Write-Host "[*] Following logs for all services" -ForegroundColor Yellow
    Write-Host "[TIP] Use Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    docker-compose -f docker-compose.local.yml logs -f
}
