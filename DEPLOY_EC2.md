# Multi-Index RAG Finance - EC2 Deployment Guide

## 🌐 Production Domain: macroinsight.me

---

## Prerequisites

1. **Ubuntu EC2 Instance** với:
   - Ubuntu 22.04 LTS hoặc mới hơn
   - Minimum: t3.medium (2 vCPU, 4GB RAM)
   - Recommended: t3.large (2 vCPU, 8GB RAM) cho production
   - **Security Group** mở ports:
     - 22 (SSH)
     - 80 (HTTP - cho Let's Encrypt & redirect)
     - 443 (HTTPS)

2. **DNS Configuration**:
   - `macroinsight.me` → EC2 Public IP
   - `www.macroinsight.me` → EC2 Public IP

3. **Đã cài đặt sẵn**:
   - Git
   - Docker
   - Docker Compose v2
   - User hiện tại có quyền chạy Docker (đã add vào docker group)

---

## Quick Start (5 Steps)

### Step 1: SSH vào EC2 instance
```bash
ssh -i your-key.pem ubuntu@54.153.255.138
```

### Step 2: Clone repository
```bash
git clone https://github.com/your-username/multi_index_rag_for_finance.git
cd multi_index_rag_for_finance
```

### Step 3: Tạo file .env
```bash
nano .env
```

Nội dung `.env`:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CUSTOM_SEARCH_API_KEY=your_search_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id

# Security - JWT key (chỉ dùng alphanumeric và -, _, không dùng special chars)
JWT_SECRET_KEY=your-super-secret-jwt-key-min-32-chars-long

# CORS Configuration (Production)
CORS_ORIGINS=https://macroinsight.me,https://www.macroinsight.me

# Domain Settings
DOMAIN=macroinsight.me
PUBLIC_URL=https://macroinsight.me

# Application Settings
LOG_LEVEL=INFO
NEWS_SCRAPE_INTERVAL_HOURS=4
```

### Step 4: Deploy Docker containers
```bash
chmod +x deploy.sh
./deploy.sh
```

### Step 5: Setup HTTPS với Let's Encrypt
```bash
chmod +x setup-ssl.sh
sudo ./setup-ssl.sh
```

---

## ✅ Sau khi deploy thành công

Truy cập:
- **Website**: https://macroinsight.me
- **API**: https://macroinsight.me/api
- **API Docs**: https://macroinsight.me/docs

---

## Architecture

```
                                    ┌─────────────────────────────────────┐
                                    │            Internet                  │
                                    └─────────────────────────────────────┘
                                                    │
                                                    │ HTTPS (443)
                                                    ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                              EC2 Instance                                │
│                                                                          │
│    ┌────────────────────────────────────────────────────────────────┐   │
│    │                      Nginx (Port 80/443)                        │   │
│    │                   SSL Termination + Proxy                       │   │
│    └───────────────────────────┬────────────────────────────────────┘   │
│                                │                                         │
│              ┌─────────────────┼─────────────────┐                      │
│              │                 │                 │                      │
│              ▼                 ▼                 ▼                      │
│    ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐         │
│    │  Frontend       │ │  Backend        │ │  Redis          │         │
│    │  (Next.js)      │ │  (FastAPI)      │ │  (Cache)        │         │
│    │  127.0.0.1:3000 │ │  127.0.0.1:8000 │ │  127.0.0.1:6379 │         │
│    └─────────────────┘ └─────────────────┘ └─────────────────┘         │
│                                │                                         │
│                                ▼                                         │
│    ┌─────────────────────────────────────────────────────────────────┐  │
│    │                     NewsAnalyst Worker                          │  │
│    │               (Scheduled background tasks)                      │  │
│    └─────────────────────────────────────────────────────────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │       External Services       │
                    │   • Supabase (Database)       │
                    │   • Google Gemini AI          │
                    │   • Google Search API         │
                    └───────────────────────────────┘
```

---

## File Structure (Deployment)

```
multi_index_rag_for_finance/
├── deploy.sh              # Main deployment script
├── setup-ssl.sh           # SSL/Nginx setup script
├── docker-compose.yml     # Container orchestration
├── .env                   # Environment variables
├── nginx/
│   └── macroinsight.me.conf  # Nginx configuration
└── DEPLOY_EC2.md          # This guide
```

---

## Script Details

### deploy.sh
Main deployment script:
```bash
./deploy.sh              # Deploy normally
./deploy.sh --clean-volumes  # Deploy + clear all data
./deploy.sh --help       # Show help
```

**Features:**
- ✅ Idempotent (safe to run multiple times)
- ✅ Error handling with immediate stop
- ✅ Detailed logging to `deploy.log`
- ✅ Health checks after deployment
- ✅ Environment validation
- ✅ Graceful container shutdown

### setup-ssl.sh
SSL setup with Let's Encrypt:
```bash
sudo ./setup-ssl.sh
```

**What it does:**
1. Install Nginx & Certbot
2. Configure HTTP server for cert challenge
3. Obtain SSL certificate from Let's Encrypt
4. Install production Nginx config
5. Setup auto-renewal (via certbot timer)
6. Configure UFW firewall

---

## Common Operations

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f newsanalyst

# Last 100 lines
docker compose logs --tail=100 backend
```

### Restart Services
```bash
# Restart all
docker compose restart

# Restart specific
docker compose restart backend
```

### Update Code
```bash
git pull origin main
./deploy.sh
sudo systemctl reload nginx
```

### Check Status
```bash
# Docker containers
docker compose ps
docker stats

# Nginx
sudo systemctl status nginx

# SSL Certificate
sudo certbot certificates
```

### SSL Certificate Renewal
```bash
# Test renewal (dry run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

---

## Troubleshooting

### 1. Container không start
```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Check environment
docker compose config

# Rebuild
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 2. SSL certificate error
```bash
# Check certificate status
sudo certbot certificates

# Check Nginx config
sudo nginx -t

# Renew certificate
sudo certbot renew

# Check DNS
dig macroinsight.me
dig www.macroinsight.me
```

### 3. 502 Bad Gateway
```bash
# Check if backend is running
curl http://127.0.0.1:8000/api/health

# Check if frontend is running
curl http://127.0.0.1:3000

# Check Nginx error log
sudo tail -f /var/log/nginx/macroinsight.error.log
```

### 4. CORS errors
Kiểm tra `.env`:
```env
CORS_ORIGINS=https://macroinsight.me,https://www.macroinsight.me
```

Restart backend:
```bash
docker compose restart backend
```

### 5. Memory issues
```bash
# Check memory
free -h

# Check container memory
docker stats

# Reduce Redis memory (docker-compose.yml)
# --maxmemory 128mb
```

---

## Security Checklist

- [ ] Security Group chỉ mở ports cần thiết (22, 80, 443)
- [ ] Không expose Docker ports ra public (dùng 127.0.0.1)
- [ ] SSL/HTTPS enabled với auto-renewal
- [ ] JWT_SECRET_KEY đủ strong (32+ chars, alphanumeric)
- [ ] CORS_ORIGINS chỉ allow domains cần thiết
- [ ] Disable SSH password auth, chỉ dùng key
- [ ] Regular updates: `sudo apt update && sudo apt upgrade`

---

## Monitoring (Optional)

### Basic monitoring với cron
```bash
# Add to crontab
crontab -e

# Check every 5 minutes
*/5 * * * * curl -sf https://macroinsight.me/api/health || echo "Health check failed" >> /var/log/health-check.log
```

### Log rotation
```bash
# Nginx logs auto-rotated by logrotate
# Docker logs - add to docker-compose.yml:
logging:
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"
```

---

## Contact & Support

- **Repository**: https://github.com/your-username/multi_index_rag_for_finance
- **Issues**: https://github.com/your-username/multi_index_rag_for_finance/issues

---

*Last updated: January 2025*
