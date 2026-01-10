# 🚀 Local Development Setup

Hướng dẫn chạy backend + frontend trên localhost để test trước khi deploy lên cloud.

---

## 📋 Prerequisites

### 1. Docker Desktop (Recommended)
- Download: https://www.docker.com/products/docker-desktop/
- Windows: Docker Desktop for Windows
- Verify: `docker --version` và `docker-compose --version`

### 2. Python Environment (Manual mode)
```powershell
# Đã có venv, activate:
.\venv\Scripts\Activate.ps1

# Check Python version (cần 3.11+)
python --version
```

### 3. Node.js (Manual mode)
```powershell
# Check Node version (cần 18+)
node --version
npm --version
```

---

## ⚙️ Configuration

### 1. Copy Environment Variables
```powershell
# Nếu chưa có .env, copy từ template:
Copy-Item .env.example .env

# Edit .env với editor bất kỳ
notepad .env
```

### 2. Fill Required Variables

**Minimum để chạy local:**
```env
# Supabase (REQUIRED - từ project Supabase của bạn)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key

# Gemini (REQUIRED)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Redis (Local)
REDIS_URL=redis://localhost:6379

# JWT Secret (generate mới)
JWT_SECRET_KEY=local-dev-secret-key-at-least-32-chars-long

# CORS for Local Frontend
CORS_ORIGINS=http://localhost:3000

# Debug mode
DEBUG=True
LOG_LEVEL=DEBUG
```

**Optional (cho fallback features):**
```env
# Google Search (for fallback)
GOOGLE_CUSTOM_SEARCH_API_KEY=your_key
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_id

# Fallback settings
FALLBACK_RATE_LIMIT_PER_USER=5
FALLBACK_RATE_LIMIT_WINDOW=3600
```

---

## 🐳 Option A: Docker Local Stack (Recommended)

### Quick Start

**1. Start Everything:**
```powershell
.\docker-local-up.ps1
```

**2. View Logs:**
```powershell
# All services
.\docker-local-logs.ps1

# Specific service
.\docker-local-logs.ps1 backend
.\docker-local-logs.ps1 frontend
```

**3. Stop Everything:**
```powershell
.\docker-local-down.ps1
```

### Services Running

- **Backend API**: http://localhost:8000
  - API Docs: http://localhost:8000/docs
  - Health: http://localhost:8000/health
  
- **Frontend**: http://localhost:3000

- **Redis**: localhost:6379

### Features

✅ **Hot Reload Enabled**
- Edit `src/` files → Backend auto-reloads
- Edit `frontend/src/` → Frontend auto-refreshes
- No rebuild needed!

✅ **Debug Mode**
- `DEBUG=True`
- `LOG_LEVEL=DEBUG`
- Detailed logs

✅ **Isolated Environment**
- Uses `docker-compose.local.yml`
- Không ảnh hưởng `docker-compose.yml` (production)
- Separate Redis container

✅ **Testing Optimized**
- Higher rate limits (999 instead of 5)
- CORS configured for localhost
- Source code mounted (không copy vào container)

### Manual Commands

```powershell
# Start with logs visible
docker-compose -f docker-compose.local.yml up

# Start in background
docker-compose -f docker-compose.local.yml up -d

# Rebuild after changes to requirements.txt or package.json
docker-compose -f docker-compose.local.yml up --build

# Stop and remove volumes (clean slate)
docker-compose -f docker-compose.local.yml down -v

# View specific service logs
docker-compose -f docker-compose.local.yml logs -f backend-local
docker-compose -f docker-compose.local.yml logs -f frontend-local

# Restart specific service
docker-compose -f docker-compose.local.yml restart backend-local

# Execute command in container
docker-compose -f docker-compose.local.yml exec backend-local bash
```

---

## 💻 Option B: Manual Local Setup

### Run Backend (FastAPI)

**Terminal 1:**
```powershell
# Activate venv
.\venv\Scripts\Activate.ps1

# Install dependencies (nếu chưa)
pip install -r requirements.txt

# Run backend với auto-reload
python -m uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Backend: **http://localhost:8000**

### Run Frontend (Next.js)

**Terminal 2:**
```powershell
cd frontend

# Install dependencies (lần đầu)
npm install

# Create .env.local
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# Run dev server
npm run dev
```

Frontend: **http://localhost:3000**

### Run Redis

**Terminal 3:**
```powershell
docker run -d -p 6379:6379 --name rag-redis redis:7-alpine
```

---

## 🧪 Testing

### 1. Test Backend Health
```powershell
curl http://localhost:8000/health
```

### 2. Test Query Endpoint
```powershell
# Via API docs (browser)
http://localhost:8000/docs

# Via curl
curl -X POST http://localhost:8000/api/query `
  -H "Content-Type: application/json" `
  -d '{"query": "ROE là gì?"}'
```

### 3. Test Frontend
1. Mở http://localhost:3000
2. Register/Login
3. Thử query: "VNM có ROE bao nhiêu trong Q3 2024?"

### 4. Test Query Guard
```powershell
# Should block malicious queries
curl -X POST http://localhost:8000/api/query `
  -H "Content-Type: application/json" `
  -d '{"query": "DROP TABLE users;"}'
```

### 5. Test Fallback Mechanism
```powershell
# Query requiring external search
python test/test_quick.py "So sánh ROE của VNM và VCB trong Q3 2024"
```

### 6. Test Rate Limiting
```powershell
# Run 6+ fallback queries to trigger rate limit
# (Chỉ với docker-compose.yml production, local có limit 999)
```

---

## 🐛 Troubleshooting

### Docker Issues

**Services không start:**
```powershell
# Check Docker running
docker info

# Check .env exists
Test-Path .env

# View detailed logs
docker-compose -f docker-compose.local.yml logs

# Rebuild from scratch
docker-compose -f docker-compose.local.yml down -v
docker-compose -f docker-compose.local.yml up --build
```

**Port conflicts:**
```powershell
# Check ports in use
netstat -ano | findstr :8000
netstat -ano | findstr :3000
netstat -ano | findstr :6379

# Kill process if needed
taskkill /PID <PID> /F

# Or use different ports in docker-compose.local.yml
```

**Hot reload không hoạt động:**
```powershell
# Ensure volumes mounted correctly
docker-compose -f docker-compose.local.yml config

# Restart with fresh build
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up --build
```

**Clean slate restart:**
```powershell
# Remove all local containers + volumes
docker-compose -f docker-compose.local.yml down -v

# Clean Docker system
docker system prune -af

# Start fresh
.\docker-local-up.ps1
```

---

### Manual Mode Issues

**Backend không start:**
```powershell
# Check .env variables
cat .env

# Check Redis
docker ps | Select-String redis

# Reinstall dependencies
pip install -r requirements.txt --upgrade
```

**Frontend không connect:**
```powershell
# Check backend running
curl http://localhost:8000/health

# Check CORS in .env
# CORS_ORIGINS=http://localhost:3000

# Check frontend/.env.local
cat frontend/.env.local
```

**Redis connection error:**
```powershell
# Restart Redis
docker restart rag-redis

# Check Redis port
netstat -an | Select-String 6379

# Test Redis connection
docker exec -it rag-redis redis-cli ping
```

---

## 📊 Monitoring & Debugging

### View Logs (Docker)
```powershell
# All services
docker-compose -f docker-compose.local.yml logs -f

# Backend only
docker-compose -f docker-compose.local.yml logs -f backend-local

# Last 100 lines
docker-compose -f docker-compose.local.yml logs --tail=100 backend-local
```

### View Logs (Manual)
```powershell
# Backend logs in terminal output
# Or check logs/ directory
Get-Content logs/backend.log -Tail 50 -Wait
```

### VS Code Debug Config
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI Backend",
      "type": "python",
      "request": "launch",
      "module": "uvicorn",
      "args": [
        "src.api.main:app",
        "--reload",
        "--port", "8000"
      ],
      "jinja": true,
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

---

## 🔄 Workflow Tips

### Hot Reload (Docker)
```powershell
# Backend changes - saved automatically
# Edit src/pipeline/nodes.py → Auto-reload

# Frontend changes - saved automatically  
# Edit frontend/src/app/page.tsx → Auto-refresh browser
```

### After Dependency Changes
```powershell
# Python packages (requirements.txt changed)
docker-compose -f docker-compose.local.yml build backend-local
docker-compose -f docker-compose.local.yml up -d backend-local

# Node packages (package.json changed)
docker-compose -f docker-compose.local.yml build frontend-local
docker-compose -f docker-compose.local.yml up -d frontend-local
```

### Database Schema Changes
```powershell
# Apply migrations in Supabase Dashboard
# Or run SQL scripts:
docker-compose -f docker-compose.local.yml exec backend-local bash
python -m src.utils.migrate
```

---

## 🚀 Next Steps

### Local → Production Transition

**Local Testing (docker-compose.local.yml):**
```powershell
docker-compose -f docker-compose.local.yml up
```

**Production Deploy (docker-compose.yml):**
```powershell
# On production server
docker-compose up -d
```

### Key Differences

| Feature | Local | Production |
|---------|-------|------------|
| Config File | `docker-compose.local.yml` | `docker-compose.yml` |
| Hot Reload | ✅ Enabled | ❌ Disabled |
| Debug Mode | ✅ True | ❌ False |
| Source Mount | ✅ Mounted | ❌ Copied into image |
| CORS | `localhost:3000` | `macroinsight.me` |
| Rate Limits | 999/hour | 5/hour |
| Ports | `0.0.0.0:8000` | `127.0.0.1:8000` (nginx proxy) |
| Redis | `redis-local` | `redis` |
| Logs | DEBUG | INFO |

### Production Checklist

Update `.env` for production:
```env
DEBUG=False
LOG_LEVEL=INFO
CORS_ORIGINS=https://macroinsight.me
FALLBACK_RATE_LIMIT_PER_USER=5
JWT_SECRET_KEY=<strong-random-key-32-chars>
REDIS_URL=redis://redis:6379
```

---

## 📚 Related Documentation

- [README.md](README.md) - Project overview
- [DEPLOY_EC2.md](DEPLOY_EC2.md) - Production deployment guide
- [docker-compose.yml](docker-compose.yml) - Production Docker config
- [docker-compose.local.yml](docker-compose.local.yml) - Local Docker config
- [docs/system.md](docs/system.md) - System architecture
- [test/](test/) - Integration tests

---

## 💡 Quick Reference

### Start Local Stack
```powershell
.\docker-local-up.ps1
```

### View Logs
```powershell
.\docker-local-logs.ps1
```

### Stop Local Stack
```powershell
.\docker-local-down.ps1
```

### Clean Reset
```powershell
docker-compose -f docker-compose.local.yml down -v
.\docker-local-up.ps1
```

### Test Query
```powershell
curl http://localhost:8000/health
# Then: http://localhost:3000
```

---

**Happy Local Development! 🎉**
