# Multi-Index RAG Finance - EC2 Deployment Guide

## Prerequisites

1. **Ubuntu EC2 Instance** với:
   - Ubuntu 22.04 LTS hoặc mới hơn
   - Minimum: t3.medium (2 vCPU, 4GB RAM)
   - Recommended: t3.large (2 vCPU, 8GB RAM) cho production
   - Security Group mở ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 8000 (Backend), 3000 (Frontend)

2. **Đã cài đặt sẵn**:
   - Git
   - Docker
   - Docker Compose v2
   - User hiện tại có quyền chạy Docker (đã add vào docker group)

## Quick Start

### Bước 1: SSH vào EC2 instance
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Bước 2: Clone repository
```bash
# Clone qua HTTPS
git clone https://github.com/your-username/multi_index_rag_for_finance.git
cd multi_index_rag_for_finance

# Hoặc clone qua SSH (nếu đã setup SSH key)
git clone git@github.com:your-username/multi_index_rag_for_finance.git
cd multi_index_rag_for_finance
```

### Bước 3: Tạo file .env
```bash
# Copy template
cp .env.example .env

# Edit với credentials thật
nano .env
```

File `.env` cần có:
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Google AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CUSTOM_SEARCH_API_KEY=your_search_api_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_search_engine_id

# Application Settings
LOG_LEVEL=INFO
NEWS_SCRAPE_INTERVAL_HOURS=4
```

### Bước 4: Chạy deployment script
```bash
# Make script executable
chmod +x deploy.sh

# Deploy
./deploy.sh
```

### Bước 5: Kiểm tra services
```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Test backend
curl http://localhost:8000/api/health

# Test frontend
curl http://localhost:3000
```

## Script Usage

### Deploy bình thường
```bash
./deploy.sh
```

### Deploy và xóa toàn bộ data (clean slate)
```bash
./deploy.sh --clean-volumes
```
⚠️ **Warning**: Sẽ xóa toàn bộ Redis data!

### Xem help
```bash
./deploy.sh --help
```

## Deploy Script Features

✅ **Idempotent**: Có thể chạy nhiều lần an toàn  
✅ **Error Handling**: Dừng ngay khi có lỗi  
✅ **Logging**: Log chi tiết vào `deploy.log`  
✅ **Health Checks**: Kiểm tra services sau khi deploy  
✅ **Environment Validation**: Validate .env trước khi deploy  
✅ **Graceful Shutdown**: Stop containers cũ trước khi start mới  
✅ **No Downtime Build**: Build images mới trước khi stop cũ  

## Common Operations

### Update code và redeploy
```bash
git pull origin main
./deploy.sh
```

### View logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f newsanalyst
docker compose logs -f redis

# Last 100 lines
docker compose logs --tail=100 backend
```

### Restart services
```bash
# Restart all
docker compose restart

# Restart specific service
docker compose restart backend
docker compose restart frontend
```

### Stop services
```bash
docker compose down
```

### Stop và xóa volumes
```bash
docker compose down -v
```

### Check resource usage
```bash
docker stats
```

### Access container shell
```bash
# Backend container
docker compose exec backend bash

# Frontend container
docker compose exec frontend sh
```

## Setup EC2 from Scratch

Nếu EC2 chưa cài Docker, chạy các lệnh sau:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker $USER

# Logout and login again for group changes to take effect
exit
# SSH lại vào

# Verify Docker
docker --version
docker compose version

# Install Git (nếu chưa có)
sudo apt install git -y

# Install curl (để test API)
sudo apt install curl -y
```

## Production Recommendations

### 1. Setup Nginx Reverse Proxy
```bash
sudo apt install nginx -y

# Configure Nginx
sudo nano /etc/nginx/sites-available/rag-finance
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/rag-finance /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. Setup SSL với Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

### 3. Setup Automatic Updates
```bash
# Create update script
cat > ~/update-app.sh << 'EOF'
#!/bin/bash
cd ~/multi_index_rag_for_finance
git pull origin main
./deploy.sh
EOF

chmod +x ~/update-app.sh

# Setup cron job (optional)
crontab -e
# Add: 0 2 * * * ~/update-app.sh >> ~/update.log 2>&1
```

### 4. Setup Monitoring
```bash
# Install htop
sudo apt install htop -y

# View logs in real-time
docker compose logs -f | grep ERROR
```

### 5. Setup Backup
```bash
# Create backup script
cat > ~/backup-redis.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker compose exec -T redis redis-cli SAVE
docker cp rag-redis:/data/dump.rdb ~/backups/redis_${DATE}.rdb
# Keep only last 7 days
find ~/backups -name "redis_*.rdb" -mtime +7 -delete
EOF

chmod +x ~/backup-redis.sh

# Run daily at 3am
crontab -e
# Add: 0 3 * * * ~/backup-redis.sh
```

## Troubleshooting

### Containers không start
```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs backend

# Rebuild từ đầu
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port already in use
```bash
# Find process using port
sudo lsof -i :8000
sudo lsof -i :3000

# Kill process
sudo kill -9 PID
```

### Out of disk space
```bash
# Clean up Docker
docker system prune -a --volumes

# Check disk usage
df -h
du -sh /var/lib/docker
```

### Permission denied
```bash
# Ensure user is in docker group
groups $USER

# If not, add and re-login
sudo usermod -aG docker $USER
exit
# SSH lại
```

### Environment variables not loading
```bash
# Check .env file exists and has correct format
cat .env

# Check no trailing spaces or special characters
dos2unix .env  # If file was created on Windows

# Reload
docker compose down
docker compose up -d
```

## Performance Tuning

### For EC2 t3.medium (4GB RAM)
```yaml
# Edit docker-compose.yml to add resource limits
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
  frontend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
```

### Enable Docker logging limits
```bash
# Edit /etc/docker/daemon.json
sudo nano /etc/docker/daemon.json
```

Add:
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

Restart Docker:
```bash
sudo systemctl restart docker
```

## Security Checklist

- [ ] SSH key-based authentication (disable password auth)
- [ ] Security Groups configured (minimal ports open)
- [ ] .env file has proper permissions (chmod 600)
- [ ] Regular security updates (unattended-upgrades)
- [ ] Fail2ban installed
- [ ] Nginx rate limiting configured
- [ ] SSL/TLS enabled
- [ ] Regular backups
- [ ] Monitoring/alerting setup

## CI/CD Integration (Optional)

### GitHub Actions
Create `.github/workflows/deploy-ec2.yml`:
```yaml
name: Deploy to EC2

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to EC2
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/multi_index_rag_for_finance
            git pull origin main
            ./deploy.sh
```

## Support

Nếu gặp vấn đề:
1. Check logs: `docker compose logs`
2. Check deploy log: `cat deploy.log`
3. Check container status: `docker compose ps`
4. Restart: `docker compose restart`
5. Clean deploy: `./deploy.sh --clean-volumes`
