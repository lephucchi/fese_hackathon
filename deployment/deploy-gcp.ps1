# Deploy Multi-Index RAG Finance to Google Cloud Run
# PowerShell script for Windows

param(
    [Parameter(Mandatory=$true)]
    [string]$ProjectId,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "asia-southeast1",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipInfrastructure
)

$ErrorActionPreference = "Stop"

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deploy RAG Finance to Cloud Run" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Variables
$REPO_NAME = "rag-finance-repo"
$ARTIFACT_REGISTRY = "${Region}-docker.pkg.dev"
$IMAGE_PREFIX = "${ARTIFACT_REGISTRY}/${ProjectId}/${REPO_NAME}"

# Set project
Write-Host "[1/10] Setting GCP project..." -ForegroundColor Yellow
gcloud config set project $ProjectId

# Enable APIs
if (-not $SkipInfrastructure) {
    Write-Host "[2/10] Enabling GCP APIs..." -ForegroundColor Yellow
    gcloud services enable run.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable redis.googleapis.com
    gcloud services enable secretmanager.googleapis.com
    gcloud services enable cloudscheduler.googleapis.com
    gcloud services enable vpcaccess.googleapis.com
} else {
    Write-Host "[2/10] Skipping infrastructure setup..." -ForegroundColor Gray
}

# Create Artifact Registry
if (-not $SkipInfrastructure) {
    Write-Host "[3/10] Creating Artifact Registry..." -ForegroundColor Yellow
    try {
        gcloud artifacts repositories create $REPO_NAME `
            --repository-format=docker `
            --location=$Region `
            --description="RAG Finance Application Images" 2>$null
        Write-Host "✓ Artifact Registry created" -ForegroundColor Green
    } catch {
        Write-Host "✓ Artifact Registry already exists" -ForegroundColor Gray
    }
    
    # Configure Docker auth
    gcloud auth configure-docker $ARTIFACT_REGISTRY
} else {
    Write-Host "[3/10] Skipping Artifact Registry setup..." -ForegroundColor Gray
}

# Create Redis (Cloud Memorystore)
if (-not $SkipInfrastructure) {
    Write-Host "[4/10] Creating Redis instance..." -ForegroundColor Yellow
    Write-Host "⚠️  This will take 5-10 minutes..." -ForegroundColor Yellow
    
    $redisExists = gcloud redis instances describe rag-redis --region=$Region 2>$null
    if (-not $redisExists) {
        gcloud redis instances create rag-redis `
            --size=1 `
            --region=$Region `
            --redis-version=redis_7_0 `
            --tier=basic
        Write-Host "✓ Redis instance created" -ForegroundColor Green
    } else {
        Write-Host "✓ Redis instance already exists" -ForegroundColor Gray
    }
} else {
    Write-Host "[4/10] Skipping Redis setup..." -ForegroundColor Gray
}

# Create VPC Connector
if (-not $SkipInfrastructure) {
    Write-Host "[5/10] Creating VPC Serverless Connector..." -ForegroundColor Yellow
    Write-Host "⚠️  This will take 3-5 minutes..." -ForegroundColor Yellow
    
    $connectorExists = gcloud compute networks vpc-access connectors describe rag-connector --region=$Region 2>$null
    if (-not $connectorExists) {
        gcloud compute networks vpc-access connectors create rag-connector `
            --network=default `
            --region=$Region `
            --range=10.8.0.0/28
        Write-Host "✓ VPC Connector created" -ForegroundColor Green
    } else {
        Write-Host "✓ VPC Connector already exists" -ForegroundColor Gray
    }
} else {
    Write-Host "[5/10] Skipping VPC Connector setup..." -ForegroundColor Gray
}

# Get Redis host
Write-Host "[6/10] Getting Redis connection info..." -ForegroundColor Yellow
$REDIS_HOST = gcloud redis instances describe rag-redis --region=$Region --format="value(host)"
Write-Host "✓ Redis host: $REDIS_HOST" -ForegroundColor Green

# Build and push images
if (-not $SkipBuild) {
    Write-Host "[7/10] Building and pushing Docker images..." -ForegroundColor Yellow
    
    # Backend
    Write-Host "  → Building backend..." -ForegroundColor Cyan
    docker build -t "${IMAGE_PREFIX}/backend:latest" .
    docker push "${IMAGE_PREFIX}/backend:latest"
    Write-Host "  ✓ Backend image pushed" -ForegroundColor Green
    
    # Frontend (we'll update this after backend deployment)
    Write-Host "  → Building frontend (initial)..." -ForegroundColor Cyan
    Push-Location frontend
    docker build --build-arg NEXT_PUBLIC_API_URL=http://localhost:8000 -t "${IMAGE_PREFIX}/frontend:latest" .
    docker push "${IMAGE_PREFIX}/frontend:latest"
    Pop-Location
    Write-Host "  ✓ Frontend image pushed" -ForegroundColor Green
} else {
    Write-Host "[7/10] Skipping Docker build..." -ForegroundColor Gray
}

# Deploy Backend
Write-Host "[8/10] Deploying Backend to Cloud Run..." -ForegroundColor Yellow
gcloud run deploy rag-backend `
    --image "${IMAGE_PREFIX}/backend:latest" `
    --region $Region `
    --platform managed `
    --port 8000 `
    --memory 2Gi `
    --cpu 2 `
    --timeout 300 `
    --min-instances 0 `
    --max-instances 10 `
    --vpc-connector rag-connector `
    --vpc-egress all-traffic `
    --allow-unauthenticated `
    --set-env-vars "REDIS_URL=redis://${REDIS_HOST}:6379,LOG_LEVEL=INFO" `
    --set-secrets "SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,SUPABASE_ANON_KEY=SUPABASE_ANON_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_CUSTOM_SEARCH_API_KEY=GOOGLE_CUSTOM_SEARCH_API_KEY:latest,GOOGLE_CUSTOM_SEARCH_ENGINE_ID=GOOGLE_CUSTOM_SEARCH_ENGINE_ID:latest"

$BACKEND_URL = gcloud run services describe rag-backend --region $Region --format="value(status.url)"
Write-Host "✓ Backend deployed: $BACKEND_URL" -ForegroundColor Green

# Deploy NewsAnalyst Worker
Write-Host "[9/10] Deploying NewsAnalyst Worker..." -ForegroundColor Yellow
gcloud run deploy rag-newsanalyst `
    --image "${IMAGE_PREFIX}/backend:latest" `
    --region $Region `
    --platform managed `
    --memory 1Gi `
    --cpu 1 `
    --timeout 900 `
    --min-instances 0 `
    --max-instances 1 `
    --vpc-connector rag-connector `
    --vpc-egress all-traffic `
    --no-allow-unauthenticated `
    --args="python","-m","src.functions.NewsAnalyst.main","--mode","scheduled" `
    --set-env-vars "REDIS_URL=redis://${REDIS_HOST}:6379,NEWS_SCRAPE_INTERVAL_HOURS=4" `
    --set-secrets "SUPABASE_URL=SUPABASE_URL:latest,SUPABASE_SERVICE_ROLE_KEY=SUPABASE_SERVICE_ROLE_KEY:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest"

Write-Host "✓ NewsAnalyst Worker deployed" -ForegroundColor Green

# Rebuild and deploy Frontend with correct backend URL
Write-Host "[10/10] Rebuilding and deploying Frontend..." -ForegroundColor Yellow
Push-Location frontend
docker build --build-arg NEXT_PUBLIC_API_URL=$BACKEND_URL -t "${IMAGE_PREFIX}/frontend:latest" .
docker push "${IMAGE_PREFIX}/frontend:latest"
Pop-Location

gcloud run deploy rag-frontend `
    --image "${IMAGE_PREFIX}/frontend:latest" `
    --region $Region `
    --platform managed `
    --port 3000 `
    --memory 512Mi `
    --cpu 1 `
    --timeout 60 `
    --min-instances 0 `
    --max-instances 5 `
    --allow-unauthenticated `
    --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL"

$FRONTEND_URL = gcloud run services describe rag-frontend --region $Region --format="value(status.url)"
Write-Host "✓ Frontend deployed: $FRONTEND_URL" -ForegroundColor Green

# Summary
Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deployment Complete! 🎉" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services:" -ForegroundColor Yellow
Write-Host "  Backend:  $BACKEND_URL" -ForegroundColor White
Write-Host "  Frontend: $FRONTEND_URL" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "  1. Test backend: curl ${BACKEND_URL}/api/health" -ForegroundColor White
Write-Host "  2. Open frontend: Start-Process $FRONTEND_URL" -ForegroundColor White
Write-Host "  3. View logs: gcloud run logs tail rag-backend --region $Region" -ForegroundColor White
Write-Host ""
Write-Host "To setup Cloud Scheduler for NewsAnalyst:" -ForegroundColor Yellow
Write-Host "  Run: .\setup-scheduler.ps1 -ProjectId $ProjectId -Region $Region" -ForegroundColor White
Write-Host ""
