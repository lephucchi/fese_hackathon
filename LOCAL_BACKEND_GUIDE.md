# Local Backend Development Guide

Run backend directly with Python venv instead of Docker for faster development.

## Why Local Backend?

**Advantages:**
- ✅ **Instant startup** - No container overhead
- ✅ **Fast model loading** - Models cached in local `~/.cache/huggingface/`
- ✅ **Hot reload** - Code changes apply instantly
- ✅ **Easy debugging** - Direct access to Python debugger
- ✅ **Better logs** - See full stack traces in terminal

**Trade-offs:**
- ⚠️ Need to manage Redis separately (still in Docker)
- ⚠️ Environment variables need local setup

---

## Quick Start

### 1. Start Redis Container
```powershell
docker-compose -f docker-compose.local.yml up redis-local -d
```

### 2. Run Backend Locally
```powershell
.\run-backend-local.ps1
```

That's it! Backend will start at `http://localhost:8000`

---

## What Happens on First Run?

**First Query (30-60 seconds):**
```
Loading encoder model: BAAI/bge-m3...
✓ BGE-M3 loaded (2.2GB)
✓ Semantic router initialized
✓ Models cached for subsequent requests
```

**All Subsequent Queries (<100ms):**
- Models already in memory
- Instant response

---

## Development Workflow

### 1. Edit Code
Make changes to any file in `src/`:
- `src/api/routes/` - API endpoints
- `src/api/services/` - Business logic
- `src/core/` - RAG pipeline components

### 2. Auto-Reload
Uvicorn detects changes and reloads automatically:
```
WARNING: StatReload detected changes in 'src/api/routes/market.py'. Reloading...
INFO: Application startup complete.
```

### 3. Test Immediately
No need to restart - changes are live!

---

## Environment Setup

### Redis Connection
Local backend connects to Redis container:
```env
# In run-backend-local.ps1
REDIS_URL=redis://localhost:6379  # Not redis://redis:6379 (Docker internal)
```

### Debug Mode
```env
DEBUG=True          # Enable detailed logs
LOG_LEVEL=INFO      # Can change to DEBUG for more verbosity
```

---

## Model Cache Location

Models are cached in:
```
Windows: C:\Users\<username>\.cache\huggingface\hub\
Linux/Mac: ~/.cache/huggingface/hub/
```

**Cached models:**
- `models--BAAI--bge-m3` (2.2GB) - Embedding encoder
- `models--sentence-transformers--all-MiniLM-L6-v2` (90MB) - Semantic router

---

## Comparing Docker vs Local

| Feature | Docker Backend | Local Backend |
|---------|---------------|---------------|
| Startup time | 5-10 seconds | <2 seconds |
| First query | 30-60s (model load) | 30-60s (model load) |
| Hot reload | ✅ (mounted volumes) | ✅ (native uvicorn) |
| Model cache | In container (12GB image) | Local ~/.cache |
| Debugging | Limited (logs only) | Full (breakpoints) |
| Deployment | Production-ready | Dev only |

---

## Common Commands

### Check Redis Status
```powershell
docker ps --filter "name=rag-redis-local"
```

### View Redis Logs
```powershell
docker logs rag-redis-local --tail 50
```

### Stop Everything
```powershell
# Stop backend: Ctrl+C in terminal
# Stop Redis:
docker stop rag-redis-local
```

### Restart Redis
```powershell
docker restart rag-redis-local
```

---

## Troubleshooting

### Issue: "Redis connection failed"
**Solution:** Ensure Redis container is running
```powershell
docker-compose -f docker-compose.local.yml up redis-local -d
```

### Issue: "Module not found"
**Solution:** Reinstall dependencies in venv
```powershell
venv\Scripts\pip install -r requirements.txt
```

### Issue: "Port 8000 already in use"
**Solution:** Stop Docker backend container
```powershell
docker stop rag-backend-local
```

### Issue: Models downloading again
**Solution:** Check HuggingFace cache location
```powershell
# Windows
dir $env:USERPROFILE\.cache\huggingface\hub\

# Should see: models--BAAI--bge-m3
```

---

## Testing with Local Backend

### Run Tests
```powershell
# Backend running in Terminal 1
.\run-backend-local.ps1

# Run tests in Terminal 2
python test/test_chat_context.py
```

### Test Endpoints
```powershell
# Health check
curl http://localhost:8000/api/health

# API docs
start http://localhost:8000/docs
```

---

## Switching Back to Docker

To go back to Docker-based development:

```powershell
# Stop local backend: Ctrl+C

# Start Docker backend
docker-compose -f docker-compose.local.yml up backend-local -d
```

---

## Performance Tips

1. **First query optimization:** Send a warmup query on startup to pre-load models

2. **Memory usage:** BGE-M3 uses ~3GB RAM when loaded. Close other apps if needed.

3. **CPU optimization:** Models run faster on CPU with:
   - Fewer background processes
   - Native Python (not Docker virtualization)

---

## Next Steps

- ✅ Backend running locally
- ✅ Redis in Docker
- ✅ Hot reload enabled
- 🚀 Start coding!

Test the chat endpoint:
```bash
POST http://localhost:8000/api/market/chat
{
  "query": "Phân tích cổ phiếu VIC",
  "use_interests": true
}
```
