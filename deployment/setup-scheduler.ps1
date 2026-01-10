# Setup Cloud Scheduler for NewsAnalyst Worker
# This triggers the NewsAnalyst worker every 4 hours

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "asia-southeast1"
)

$ErrorActionPreference = "Stop"

Write-Host "Setting up Cloud Scheduler for NewsAnalyst..." -ForegroundColor Cyan

# Set project
gcloud config set project $ProjectId

# Get NewsAnalyst service URL
$NEWSANALYST_URL = gcloud run services describe rag-newsanalyst --region $Region --format="value(status.url)"
Write-Host "NewsAnalyst URL: $NEWSANALYST_URL" -ForegroundColor Gray

# Create service account if not exists
$SA_NAME = "cloud-scheduler-invoker"
$SA_EMAIL = "${SA_NAME}@${ProjectId}.iam.gserviceaccount.com"

Write-Host "Creating service account..." -ForegroundColor Yellow
try {
    gcloud iam service-accounts create $SA_NAME `
        --display-name="Cloud Scheduler Invoker" 2>$null
    Write-Host "✓ Service account created" -ForegroundColor Green
} catch {
    Write-Host "✓ Service account already exists" -ForegroundColor Gray
}

# Grant Cloud Run Invoker role
Write-Host "Granting Cloud Run Invoker role..." -ForegroundColor Yellow
gcloud run services add-iam-policy-binding rag-newsanalyst `
    --region=$Region `
    --member="serviceAccount:${SA_EMAIL}" `
    --role="roles/run.invoker"
Write-Host "✓ Role granted" -ForegroundColor Green

# Create scheduler job (every 4 hours)
Write-Host "Creating Cloud Scheduler job..." -ForegroundColor Yellow

# Delete existing job if exists
try {
    gcloud scheduler jobs delete news-analyst-trigger --location=$Region --quiet 2>$null
} catch {}

# Create new job - trigger endpoint needs to be implemented in NewsAnalyst
# For now, we just trigger the service which will run its scheduled task
gcloud scheduler jobs create http news-analyst-trigger `
    --location $Region `
    --schedule "0 */4 * * *" `
    --uri "${NEWSANALYST_URL}/" `
    --http-method POST `
    --oidc-service-account-email $SA_EMAIL `
    --oidc-token-audience $NEWSANALYST_URL

Write-Host "✓ Cloud Scheduler job created" -ForegroundColor Green
Write-Host ""
Write-Host "NewsAnalyst will now run every 4 hours automatically!" -ForegroundColor Green
Write-Host "Schedule: 0 */4 * * * (every 4 hours)" -ForegroundColor Gray
Write-Host ""
Write-Host "To manually trigger:" -ForegroundColor Yellow
Write-Host "  gcloud scheduler jobs run news-analyst-trigger --location=$Region" -ForegroundColor White
Write-Host ""
Write-Host "To view job status:" -ForegroundColor Yellow
Write-Host "  gcloud scheduler jobs describe news-analyst-trigger --location=$Region" -ForegroundColor White
Write-Host ""
