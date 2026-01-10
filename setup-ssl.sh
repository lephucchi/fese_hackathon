#!/bin/bash

###############################################################################
# SSL Setup Script for macroinsight.me
# 
# Purpose: Install Nginx, configure reverse proxy, setup Let's Encrypt SSL
# Prerequisites: Ubuntu server with Docker running, domain DNS configured
# Usage: sudo ./setup-ssl.sh
#
# Author: DevOps Team
# Version: 1.0.0
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

DOMAIN="macroinsight.me"
EMAIL="admin@macroinsight.me"  # Change this to your email
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

log() { echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"; }
log_success() { echo -e "${GREEN}[$(date +'%H:%M:%S')] ✓${NC} $1"; }
log_warning() { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠${NC} $1"; }
log_error() { echo -e "${RED}[$(date +'%H:%M:%S')] ✗${NC} $1"; }

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    log_error "Please run as root: sudo ./setup-ssl.sh"
    exit 1
fi

log "=========================================="
log "SSL Setup for ${DOMAIN}"
log "=========================================="

# =============================================================================
# Step 1: Install Nginx and Certbot
# =============================================================================
log "Installing Nginx and Certbot..."

apt update
apt install -y nginx certbot python3-certbot-nginx

log_success "Nginx and Certbot installed"

# =============================================================================
# Step 2: Stop Nginx temporarily
# =============================================================================
log "Stopping Nginx temporarily..."
systemctl stop nginx || true

# =============================================================================
# Step 3: Create initial Nginx config (HTTP only for cert generation)
# =============================================================================
log "Creating initial Nginx configuration..."

# Create directory for certbot challenges
mkdir -p /var/www/certbot

# Create temporary HTTP-only config
cat > /etc/nginx/sites-available/macroinsight.me << 'EOF'
# Temporary HTTP config for Let's Encrypt certificate generation

server {
    listen 80;
    listen [::]:80;
    server_name macroinsight.me www.macroinsight.me;

    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    # Temporary - will be replaced with HTTPS redirect
    location / {
        return 200 'Setting up SSL...';
        add_header Content-Type text/plain;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/macroinsight.me /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and start Nginx
nginx -t
systemctl start nginx

log_success "Initial Nginx config created"

# =============================================================================
# Step 4: Obtain SSL Certificate
# =============================================================================
log "Obtaining SSL certificate from Let's Encrypt..."
log_warning "Make sure DNS is properly configured for ${DOMAIN}"

# Obtain certificate
certbot certonly --webroot \
    -w /var/www/certbot \
    -d ${DOMAIN} \
    -d www.${DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --non-interactive \
    --expand

if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    log_error "SSL certificate generation failed!"
    log_error "Make sure DNS A records point to this server:"
    log_error "  ${DOMAIN} -> $(curl -s ifconfig.me)"
    log_error "  www.${DOMAIN} -> $(curl -s ifconfig.me)"
    exit 1
fi

log_success "SSL certificate obtained"

# =============================================================================
# Step 5: Install Production Nginx Config
# =============================================================================
log "Installing production Nginx configuration..."

# Copy the full config
cp "${PROJECT_DIR}/nginx/macroinsight.me.conf" /etc/nginx/sites-available/macroinsight.me

# Test configuration
nginx -t

# Reload Nginx
systemctl reload nginx

log_success "Production Nginx config installed"

# =============================================================================
# Step 6: Setup Auto-Renewal
# =============================================================================
log "Setting up SSL auto-renewal..."

# Create renewal hook
mkdir -p /etc/letsencrypt/renewal-hooks/deploy

cat > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh << 'EOF'
#!/bin/bash
systemctl reload nginx
EOF

chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh

# Test renewal
certbot renew --dry-run

# Enable certbot timer
systemctl enable certbot.timer
systemctl start certbot.timer

log_success "Auto-renewal configured"

# =============================================================================
# Step 7: Configure Firewall
# =============================================================================
log "Configuring firewall..."

if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow 22/tcp
    ufw --force enable
    log_success "UFW firewall configured"
else
    log_warning "UFW not installed, skipping firewall setup"
fi

# =============================================================================
# Step 8: Update Docker Compose to use internal ports
# =============================================================================
log "Updating Docker Compose configuration..."

cd "${PROJECT_DIR}"

# Check if containers are running and restart them
if docker compose ps --quiet | grep -q .; then
    log "Restarting Docker containers..."
    docker compose down
    docker compose up -d
    log_success "Docker containers restarted"
fi

# =============================================================================
# Summary
# =============================================================================
echo ""
log "=========================================="
log_success "SSL Setup Complete! 🔒"
log "=========================================="
echo ""
log "Your site is now available at:"
log "  - https://${DOMAIN}"
log "  - https://www.${DOMAIN}"
echo ""
log "API endpoints:"
log "  - https://${DOMAIN}/api"
log "  - https://${DOMAIN}/docs"
echo ""
log "SSL certificate will auto-renew before expiration."
echo ""
log "To check certificate status:"
log "  sudo certbot certificates"
echo ""
log "To manually renew:"
log "  sudo certbot renew"
echo ""
log "Nginx logs:"
log "  - /var/log/nginx/macroinsight.access.log"
log "  - /var/log/nginx/macroinsight.error.log"
echo ""
