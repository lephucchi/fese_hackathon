#!/bin/bash

###############################################################################
# Multi-Index RAG Finance - Production Deployment Script
# 
# Purpose: Deploy dockerized application on Ubuntu EC2
# Prerequisites: Git, Docker, Docker Compose v2 installed
# Usage: ./deploy.sh [--clean-volumes]
#
# Author: DevOps Team
# Version: 1.0.0
###############################################################################

set -e  # Exit immediately if a command exits with a non-zero status
set -u  # Treat unset variables as an error
set -o pipefail  # Prevent errors in a pipeline from being masked

# =============================================================================
# Configuration
# =============================================================================
PROJECT_NAME="multi-index-rag-finance"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${PROJECT_DIR}/deploy.log"
ENV_FILE="${PROJECT_DIR}/.env"
DOCKER_COMPOSE_FILE="${PROJECT_DIR}/docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =============================================================================
# Helper Functions
# =============================================================================

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log_error "$1"
    log_error "Deployment failed. Check ${LOG_FILE} for details."
    exit 1
}

# =============================================================================
# Pre-flight Checks
# =============================================================================

log "=========================================="
log "Starting deployment for ${PROJECT_NAME}"
log "=========================================="

# Check if running as root (not recommended for Docker)
if [ "$EUID" -eq 0 ]; then 
    log_warning "Running as root is not recommended. Consider using a non-root user with Docker permissions."
fi

# Check Docker installation
log "Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    error_exit "Docker is not installed. Please install Docker first."
fi
docker --version | tee -a "$LOG_FILE"
log_success "Docker found"

# Check Docker Compose v2
log "Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    error_exit "Docker Compose v2 is not installed. Please install Docker Compose v2."
fi
docker compose version | tee -a "$LOG_FILE"
log_success "Docker Compose found"

# Check if user can run Docker without sudo
log "Checking Docker permissions..."
if ! docker ps &> /dev/null; then
    error_exit "Cannot run Docker commands. Please add your user to the docker group: sudo usermod -aG docker \$USER"
fi
log_success "Docker permissions OK"

# Check if docker-compose.yml exists
if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
    error_exit "docker-compose.yml not found at ${DOCKER_COMPOSE_FILE}"
fi
log_success "docker-compose.yml found"

# =============================================================================
# Environment Variables
# =============================================================================

log "Checking environment variables..."
if [ ! -f "$ENV_FILE" ]; then
    log_warning ".env file not found. Creating template..."
    cat > "$ENV_FILE" << 'EOF'
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CUSTOM_SEARCH_API_KEY=your_search_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id

# Application Settings
LOG_LEVEL=INFO
NEWS_SCRAPE_INTERVAL_HOURS=4
EOF
    log_warning "Please edit .env file with your actual credentials before deployment"
    log_warning "Deploy will continue, but services may fail without proper credentials"
else
    log_success ".env file found"
    
    # Validate critical environment variables (use grep to avoid shell expansion issues)
    REQUIRED_VARS=(
        "SUPABASE_URL"
        "SUPABASE_SERVICE_ROLE_KEY"
        "SUPABASE_ANON_KEY"
        "GEMINI_API_KEY"
    )
    
    MISSING_VARS=()
    for var in "${REQUIRED_VARS[@]}"; do
        # Check if variable exists in .env file and is not a placeholder
        if ! grep -q "^${var}=" "$ENV_FILE" 2>/dev/null; then
            MISSING_VARS+=("$var")
        elif grep "^${var}=" "$ENV_FILE" | grep -q "your_\|YOUR_\|xxx"; then
            MISSING_VARS+=("$var")
        fi
    done
    
    if [ ${#MISSING_VARS[@]} -ne 0 ]; then
        log_warning "Missing or placeholder values for: ${MISSING_VARS[*]}"
        log_warning "Services may not work properly without these credentials"
    else
        log_success "All required environment variables are set"
    fi
fi

# =============================================================================
# Parse Command Line Arguments
# =============================================================================

CLEAN_VOLUMES=false
for arg in "$@"; do
    case $arg in
        --clean-volumes)
            CLEAN_VOLUMES=true
            log_warning "Will clean Docker volumes (data will be lost!)"
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --clean-volumes    Remove all Docker volumes (WARNING: data loss)"
            echo "  --help            Show this help message"
            exit 0
            ;;
        *)
            error_exit "Unknown argument: $arg. Use --help for usage information."
            ;;
    esac
done

# =============================================================================
# Stop Existing Containers
# =============================================================================

log "Stopping existing containers..."
cd "$PROJECT_DIR"

if docker compose ps --quiet | grep -q .; then
    log "Found running containers, stopping them..."
    docker compose down || log_warning "Some containers may have already been stopped"
    log_success "Containers stopped"
else
    log "No running containers found"
fi

# Clean volumes if requested
if [ "$CLEAN_VOLUMES" = true ]; then
    log_warning "Removing Docker volumes..."
    docker compose down -v || log_warning "Could not remove all volumes"
    log_success "Volumes removed"
fi

# =============================================================================
# Pull Latest Images / Build
# =============================================================================

log "Cleaning Docker build cache to prevent snapshot errors..."
docker builder prune -f || log_warning "Could not prune builder cache"
log_success "Docker cache cleaned"

log "Building Docker images..."
docker compose build --no-cache || error_exit "Failed to build Docker images"
log_success "Images built successfully"

# =============================================================================
# Start Services
# =============================================================================

log "Starting services with Docker Compose..."
docker compose up -d || error_exit "Failed to start services"
log_success "Services started"

# =============================================================================
# Wait for Services to be Healthy
# =============================================================================

log "Waiting for services to be healthy..."
TIMEOUT=120
ELAPSED=0
INTERVAL=5

while [ $ELAPSED -lt $TIMEOUT ]; do
    # Check Redis health
    if docker compose ps redis | grep -q "healthy"; then
        log_success "Redis is healthy"
        break
    fi
    
    log "Waiting for Redis... (${ELAPSED}s/${TIMEOUT}s)"
    sleep $INTERVAL
    ELAPSED=$((ELAPSED + INTERVAL))
done

if [ $ELAPSED -ge $TIMEOUT ]; then
    log_warning "Redis health check timeout, but continuing..."
fi

# Wait for backend to be ready
log "Waiting for backend API..."
sleep 10

# =============================================================================
# Database Migration (if needed)
# =============================================================================

log "Checking for database migrations..."
# Run migrations if your project has them
# Example: docker compose exec -T backend python -m alembic upgrade head
# For now, skipping as project may not have migrations configured
log "Skipping database migrations (not configured)"

# =============================================================================
# Post-Deployment Checks
# =============================================================================

log "Running post-deployment checks..."

# Check container status
log "Container Status:"
docker compose ps | tee -a "$LOG_FILE"

# Check if all expected containers are running
EXPECTED_CONTAINERS=("redis" "backend" "newsanalyst" "frontend")
FAILED_CONTAINERS=()

for container in "${EXPECTED_CONTAINERS[@]}"; do
    if docker compose ps "$container" | grep -q "Up"; then
        log_success "${container} is running"
    else
        log_error "${container} is not running"
        FAILED_CONTAINERS+=("$container")
    fi
done

# Show logs for failed containers
if [ ${#FAILED_CONTAINERS[@]} -ne 0 ]; then
    log_error "Some containers failed to start: ${FAILED_CONTAINERS[*]}"
    for container in "${FAILED_CONTAINERS[@]}"; do
        log "Showing logs for ${container}:"
        docker compose logs --tail=50 "$container" | tee -a "$LOG_FILE"
    done
    error_exit "Deployment completed with errors"
fi

# Test backend health endpoint
log "Testing backend health endpoint..."
sleep 5
if curl -sf http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    log_success "Backend health check passed"
else
    log_warning "Backend health check failed (service may still be starting)"
fi

# Test frontend
log "Testing frontend..."
if curl -sf http://127.0.0.1:3000 > /dev/null 2>&1; then
    log_success "Frontend is accessible"
else
    log_warning "Frontend not yet accessible (may need more time to start)"
fi

# =============================================================================
# SSL/Nginx Setup Check
# =============================================================================

DOMAIN="macroinsight.me"
SETUP_SSL_SCRIPT="${PROJECT_DIR}/setup-ssl.sh"

log "Checking Nginx/SSL configuration..."

# Check if Nginx is installed
if command -v nginx &> /dev/null; then
    log_success "Nginx is installed"
    
    # Check if SSL certificate exists
    if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
        log_success "SSL certificate found for ${DOMAIN}"
        
        # Reload Nginx to pick up any changes
        sudo systemctl reload nginx || log_warning "Could not reload Nginx"
    else
        log_warning "SSL certificate not found for ${DOMAIN}"
        log_warning "Run 'sudo ./setup-ssl.sh' to set up HTTPS"
    fi
else
    log_warning "Nginx is not installed"
    log_warning "For production with HTTPS, run: sudo ./setup-ssl.sh"
fi

# =============================================================================
# Summary
# =============================================================================

log ""
log "=========================================="
log_success "Deployment completed successfully!"
log "=========================================="
log ""
log "Services (internal):"
log "  - Backend API: 127.0.0.1:8000"
log "  - Frontend:    127.0.0.1:3000"
log "  - Redis:       127.0.0.1:6379"
log ""

# Check if Nginx/SSL is configured
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    log "Public URLs (HTTPS via Nginx):"
    log "  - Website:     https://${DOMAIN}"
    log "  - API:         https://${DOMAIN}/api"
    log "  - API Docs:    https://${DOMAIN}/docs"
else
    log "⚠️  HTTPS not configured yet!"
    log "Run: sudo ./setup-ssl.sh"
    log ""
    log "Temporary access (HTTP only):"
    log "  - Backend API: http://<your-ip>:8000"
    log "  - Frontend:    http://<your-ip>:3000"
fi

log ""
log "Useful commands:"
log "  - View logs:        docker compose logs -f"
log "  - View logs (service): docker compose logs -f backend"
log "  - Stop services:    docker compose down"
log "  - Restart services: docker compose restart"
log "  - Check status:     docker compose ps"
log "  - Setup HTTPS:      sudo ./setup-ssl.sh"
log ""
log "Deployment log saved to: ${LOG_FILE}"
log ""

# Show resource usage
log "Container Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | tee -a "$LOG_FILE"

log ""
log_success "Deployment complete! 🚀"
