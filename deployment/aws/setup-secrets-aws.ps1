# Setup AWS Secrets Manager
# This script helps you create secrets from your .env file

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "ap-southeast-1",
    
    [Parameter(Mandatory=$false)]
    [string]$EnvFile = ".env",
    
    [Parameter(Mandatory=$false)]
    [string]$RedisEndpoint = ""
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up AWS Secrets Manager..." -ForegroundColor Cyan
Write-Host ""

# Check if .env file exists
if (-not (Test-Path $EnvFile)) {
    Write-Host "Warning: $EnvFile not found!" -ForegroundColor Yellow
    Write-Host "Creating secrets with placeholder values..." -ForegroundColor Yellow
}

# Read .env file if exists
$envVars = @{}
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim().Trim('"').Trim("'")
            $envVars[$key] = $value
        }
    }
}

# Prepare secrets object
$secrets = @{
    SUPABASE_URL = if ($envVars['SUPABASE_URL']) { $envVars['SUPABASE_URL'] } else { "your_supabase_url" }
    SUPABASE_SERVICE_ROLE_KEY = if ($envVars['SUPABASE_SERVICE_ROLE_KEY']) { $envVars['SUPABASE_SERVICE_ROLE_KEY'] } else { "your_service_role_key" }
    SUPABASE_ANON_KEY = if ($envVars['SUPABASE_ANON_KEY']) { $envVars['SUPABASE_ANON_KEY'] } else { "your_anon_key" }
    GEMINI_API_KEY = if ($envVars['GEMINI_API_KEY']) { $envVars['GEMINI_API_KEY'] } else { "your_gemini_key" }
    GOOGLE_CUSTOM_SEARCH_API_KEY = if ($envVars['GOOGLE_CUSTOM_SEARCH_API_KEY']) { $envVars['GOOGLE_CUSTOM_SEARCH_API_KEY'] } else { "your_search_key" }
    GOOGLE_CUSTOM_SEARCH_ENGINE_ID = if ($envVars['GOOGLE_CUSTOM_SEARCH_ENGINE_ID']) { $envVars['GOOGLE_CUSTOM_SEARCH_ENGINE_ID'] } else { "your_search_engine_id" }
}

# Add Redis URL if provided
if ($RedisEndpoint) {
    $secrets['REDIS_URL'] = "redis://${RedisEndpoint}"
}

# Convert to JSON
$secretsJson = $secrets | ConvertTo-Json -Compress

# Check if secret exists
$SECRET_EXISTS = (aws secretsmanager describe-secret --secret-id "${ProjectName}/app-secrets" --region $Region 2>$null)

if ($SECRET_EXISTS) {
    Write-Host "Updating existing secret..." -ForegroundColor Yellow
    aws secretsmanager update-secret --secret-id "${ProjectName}/app-secrets" --secret-string $secretsJson --region $Region
    Write-Host "✓ Secret updated successfully" -ForegroundColor Green
} else {
    Write-Host "Creating new secret..." -ForegroundColor Yellow
    aws secretsmanager create-secret --name "${ProjectName}/app-secrets" --secret-string $secretsJson --region $Region
    Write-Host "✓ Secret created successfully" -ForegroundColor Green
}

Write-Host ""
Write-Host "Secrets stored in AWS Secrets Manager:" -ForegroundColor Cyan
Write-Host "  Secret Name: ${ProjectName}/app-secrets" -ForegroundColor White
Write-Host "  Region: ${Region}" -ForegroundColor White
Write-Host ""

# Display secrets (without values)
Write-Host "Secret keys:" -ForegroundColor Yellow
$secrets.Keys | ForEach-Object {
    Write-Host "  - $_" -ForegroundColor Gray
}

Write-Host ""
Write-Host "To view secret:" -ForegroundColor Yellow
Write-Host "  aws secretsmanager get-secret-value --secret-id ${ProjectName}/app-secrets --region ${Region}" -ForegroundColor White
Write-Host ""
Write-Host "To update a specific key:" -ForegroundColor Yellow
Write-Host "  1. Get current secret" -ForegroundColor White
Write-Host "  2. Modify the JSON" -ForegroundColor White
Write-Host "  3. Update: aws secretsmanager update-secret --secret-id ${ProjectName}/app-secrets --secret-string 'NEW_JSON' --region ${Region}" -ForegroundColor White
Write-Host ""
