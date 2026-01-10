# 🔄 Hot Reload Guide - Local Development

## Cách thức hoạt động

### Backend (Python/FastAPI)
✅ **Hot Reload Enabled** - Code changes tự động reload

**Mounted volumes:**
```yaml
- ./src:/app/src:ro          # Source code (read-only)
- ./test:/app/test:ro        # Test files
- ./logs:/app/logs           # Logs (read-write)
```

**Uvicorn command:**
```bash
uvicorn src.api.main:app --reload
```

---

## 📝 Workflow: Thay đổi code

### 1. Edit Python files
```powershell
#Ví dụ: Sửa file route
notepad src/api/routes/query.py

# Hoặc dùng VS Code
code src/api/routes/query.py
```

### 2. Save file
- Uvicorn tự động detect changes
- Backend reload trong **1-2 giây**

### 3. Check logs
```powershell
# Xem reload message
docker logs rag-backend-local --tail 20

# Output example:
# WARNING:  StatReload detected changes in 'src/api/routes/query.py'. Reloading...
# INFO:     Application startup complete.
```

### 4. Test ngay
```powershell
# API đã reload, test luôn
Invoke-RestMethod -Uri "http://localhost:8000/api/health"
```

---

## 🎨 Frontend (Next.js)

✅ **Fast Refresh Enabled** - UI changes tự động update

**Mounted volume:**
```yaml
- ./frontend:/app            # Toàn bộ frontend code
```

### Workflow:
1. Edit file trong `frontend/src/`
2. Save
3. Browser tự động refresh (Hot Module Replacement)
4. **Không cần reload page!**

```powershell
# Example: Edit component
code frontend/src/components/ChatInterface.tsx

# Save → Browser updates instantly
```

---

## ⚠️ Khi nào cần RESTART?

### Backend - Cần restart khi:

**1. Thay đổi dependencies (`requirements.txt`)**
```powershell
# Rebuild image
docker-compose -f docker-compose.local.yml build backend-local

# Restart
docker-compose -f docker-compose.local.yml up -d backend-local
```

**2. Thay đổi environment variables (`.env`)**
```powershell
# Restart để load .env mới
docker-compose -f docker-compose.local.yml restart backend-local
```

**3. Thay đổi Dockerfile**
```powershell
# Rebuild from scratch
docker-compose -f docker-compose.local.yml up --build backend-local
```

**4. Lỗi không tự recover**
```powershell
# Force restart
docker restart rag-backend-local

# Hoặc recreate container
docker-compose -f docker-compose.local.yml up -d --force-recreate backend-local
```

---

### Frontend - Cần restart khi:

**1. Thay đổi `package.json` (add/remove packages)**
```powershell
# Restart để chạy npm install lại
docker restart rag-frontend-local

# Wait 10-20s cho npm install xong
Start-Sleep -Seconds 15
docker logs rag-frontend-local --tail 20
```

**2. Thay đổi `next.config.ts` hoặc config files**
```powershell
docker restart rag-frontend-local
```

**3. Thay đổi `.env.local`**
```powershell
docker restart rag-frontend-local
```

---

## 🚫 KHÔNG cần restart cho:

### Backend
- ✅ Thay đổi code trong `src/`
- ✅ Thay đổi code trong `test/`
- ✅ Thêm/sửa routes, services, utils
- ✅ Thay đổi prompts, templates
- ✅ Fix bugs

### Frontend
- ✅ Thay đổi components (`src/components/`)
- ✅ Thay đổi pages (`src/app/`)
- ✅ Thay đổi CSS/styling
- ✅ Thay đổi hooks, contexts
- ✅ Fix UI bugs

---

## 🛠️ Debug Tips

### Backend không reload?

**Check 1: Verify volumes mounted**
```powershell
docker exec rag-backend-local ls -la /app/src/api/routes/
# Should show your files with recent timestamps
```

**Check 2: Verify reload enabled**
```powershell
docker logs rag-backend-local | Select-String "reload"
# Should see: "Started reloader process [1] using StatReload"
```

**Check 3: File permissions (Windows mount issues)**
```powershell
# Ensure files not read-only on Windows
Get-ChildItem src -Recurse | % { $_.IsReadOnly = $false }
```

**Check 4: Syntax errors preventing reload**
```powershell
# Check logs for Python errors
docker logs rag-backend-local --tail 50
```

### Frontend không update?

**Check 1: Browser cache**
```
Ctrl + Shift + R (hard refresh)
Or: F12 → Network tab → "Disable cache"
```

**Check 2: Next.js process running**
```powershell
docker logs rag-frontend-local | Select-String "Ready"
# Should see: "✓ Ready in 3.6s"
```

**Check 3: Correct port**
```
http://localhost:3000  ✅
http://localhost:8000  ❌ (This is backend)
```

---

## 📊 Monitor Changes Live

### Backend logs (follow)
```powershell
# Watch reload messages
docker logs rag-backend-local -f

# Or use helper script
.\docker-local-logs.ps1 backend
```

### All services
```powershell
.\docker-local-logs.ps1
```

### Split terminal (recommended)
```powershell
# Terminal 1: Backend logs
docker logs rag-backend-local -f

# Terminal 2: Frontend logs
docker logs rag-frontend-local -f

# Terminal 3: Code editor
code .
```

---

## 🎯 Quick Commands

```powershell
# Restart backend only
docker restart rag-backend-local

# Restart frontend only
docker restart rag-frontend-local

# Restart all
docker-compose -f docker-compose.local.yml restart

# Rebuild backend (after requirements.txt change)
docker-compose -f docker-compose.local.yml build backend-local
docker-compose -f docker-compose.local.yml up -d backend-local

# Clean restart (reset everything)
docker-compose -f docker-compose.local.yml down
docker-compose -f docker-compose.local.yml up -d
```

---

## 💡 Pro Tips

### 1. VS Code Terminal Split
```
Ctrl + ` → Open terminal
Ctrl + Shift + 5 → Split terminal
```

### 2. Watch specific files
```powershell
# PowerShell file watcher
Get-Content logs/backend.log -Wait -Tail 10
```

### 3. Test sau mỗi change
```powershell
# Tạo alias
function Test-API { .\test-local-stack.ps1 }
Set-Alias -Name test -Value Test-API

# Usage
test
```

### 4. Pre-commit validation
```powershell
# Check syntax before committing
python -m py_compile src/api/**/*.py
```

---

## 🔄 Typical Development Loop

```powershell
# 1. Edit code
code src/api/routes/query.py

# 2. Save (Ctrl+S)

# 3. Check reload in logs (auto-happens)
# See: "WARNING: StatReload detected changes..."

# 4. Test immediately
Invoke-RestMethod http://localhost:8000/api/health

# 5. Repeat!
```

**No manual restart needed!** 🎉

---

## 📚 Related Commands

```powershell
# Full stack status
.\test-local-stack.ps1

# Stop stack
.\docker-local-down.ps1

# Start stack
.\docker-local-up.ps1

# View logs
.\docker-local-logs.ps1
```
