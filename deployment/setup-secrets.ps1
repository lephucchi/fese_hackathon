# Setup Google Cloud Secrets
# This script helps you create secrets from your .env file

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$EnvFile = ".env"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up Google Cloud Secrets..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "Error: $EnvFile not found!" -ForegroundColor Red
    Write-Host "Please create a .env file with your secrets first." -ForegroundColor Yellow
    exit 1
}

# Set project
gcloud config set project $ProjectId

# Read .env file and create secrets
Write-Host "Reading $EnvFile..." -ForegroundColor Yellow
$envContent = Get-Content $EnvFile

# Secret names to create
$secretNames = @(
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_ANON_KEY",
    "GEMINI_API_KEY",
    "GOOGLE_CUSTOM_SEARCH_API_KEY",
    "GOOGLE_CUSTOM_SEARCH_ENGINE_ID"
)

foreach ($secretName in $secretNames) {
    # Find the value in .env
    $line = $envContent | Where-Object { $_ -match "^${secretName}=" }
    
    if ($line) {
        # Extract value (remove quotes if present)
        $value = ($line -split "=", 2)[1].Trim().Trim('"').Trim("'")
        
        if ($value) {
            Write-Host "Creating secret: $secretName" -ForegroundColor Cyan
            
            # Delete existing secret if exists
            try {
                gcloud secrets delete $secretName --quiet 2>$null
            } catch {}
            
            # Create secret
            echo $value | gcloud secrets create $secretName --data-file=-
            Write-Host "✓ Secret $secretName created" -ForegroundColor Green
        } else {
            Write-Host "⚠ Warning: $secretName is empty in .env" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠ Warning: $secretName not found in .env" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Secrets Setup Complete! 🎉" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "To view secrets:" -ForegroundColor Yellow
Write-Host "  gcloud secrets list" -ForegroundColor White
Write-Host ""
Write-Host "To update a secret:" -ForegroundColor Yellow
Write-Host "  echo 'new-value' | gcloud secrets versions add SECRET_NAME --data-file=-" -ForegroundColor White
Write-Host ""
Write-Host "Next step: Run .\deploy-gcp.ps1 -ProjectId $ProjectId" -ForegroundColor Yellow
Write-Host ""
