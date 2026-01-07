# FastAPI Backend Architecture

## 📋 Tổng quan

Hệ thống FastAPI được thiết kế theo kiến trúc **Routes → Services → Repositories** (tương đương **Controller → Service → Repository** pattern), tuân thủ nguyên tắc SOLID và Clean Architecture.

## 🏗️ Kiến trúc tổng thể

```
┌─────────────────────────────────────────────────────────────┐
│                         Client                              │
│                    (Frontend/Postman)                       │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP Request
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                      FastAPI App                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Middleware Layer                        │   │
│  │  • CORS                                              │   │
│  │  • Request/Response Logging                          │   │
│  │  • Authentication (JWT) - TODO                       │   │
│  │  • Rate Limiting - TODO                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │               Routes Layer                           │   │
│  │  • Validate input (Pydantic)                         │   │
│  │  • Call services                                     │   │
│  │  • Format response                                   │   │
│  │  • Handle HTTP concerns                              │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │              Services Layer                          │   │
│  │  • Business logic                                    │   │
│  │  • Orchestrate multiple repositories                 │   │
│  │  • Transform data                                    │   │
│  │  • No HTTP/database concerns                         │   │
│  └──────────────────────┬──────────────────────────────┘   │
│                         │                                    │
│  ┌──────────────────────▼──────────────────────────────┐   │
│  │            Repositories Layer                        │   │
│  │  • Pure data access                                  │   │
│  │  • CRUD operations                                   │   │
│  │  • RPC function calls                                │   │
│  │  • Return database schemas                           │   │
│  └──────────────────────┬──────────────────────────────┘   │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │      Supabase        │
              │  (PostgreSQL + pgvector) │
              └──────────────────────┘
```

## 📁 Cấu trúc thư mục

```
src/api/
├── main.py                    # FastAPI app chính - khởi tạo app, middleware, routers
├── dependencies.py            # Dependency injection - Supabase client, singletons
│
├── routes/                    # HTTP endpoints (thin layer)
│   ├── __init__.py
│   ├── query.py              # Query processing endpoints
│   ├── health.py             # Health check endpoint
│   └── authenticate/         # Authentication endpoints (TODO)
│
├── services/                  # Business logic (thick layer)
│   ├── __init__.py
│   └── query_service.py      # RAG pipeline orchestration
│
├── repositories/              # Data access layer
│   ├── __init__.py
│   ├── base.py               # Base repository với CRUD methods
│   └── vector_repo.py        # Vector similarity search (RPC calls)
│
├── schemas/                   # Pydantic models cho API
│   ├── __init__.py
│   ├── requests/             # Request validation schemas
│   │   ├── __init__.py
│   │   └── query.py          # QueryRequest, QueryOptions
│   └── responses/            # Response formatting schemas
│       ├── __init__.py
│       ├── query.py          # QueryResponse, Citation, Metadata
│       └── common.py         # HealthResponse, ErrorResponse
│
├── middleware/                # Cross-cutting concerns
│   ├── __init__.py
│   └── logging.py            # Request/response logging middleware
│
└── exceptions/                # Error handling
    ├── __init__.py
    ├── base.py               # Custom exception classes
    └── handlers.py           # FastAPI exception handlers
```

## 🎯 Chi tiết từng layer

### 1️⃣ **main.py** - Application Entry Point

**Chức năng:**
- Khởi tạo FastAPI application
- Cấu hình CORS
- Đăng ký middleware
- Đăng ký exception handlers
- Include routers
- Lifespan management (pre-warming models)

**Responsibilities:**
```python
✅ Create FastAPI app
✅ Configure middleware (CORS, logging, auth)
✅ Register exception handlers
✅ Include routers with prefixes
✅ Pre-warm heavy models on startup
✅ Define root endpoint
```

**Không làm:**
```
❌ Business logic
❌ Database access
❌ Request validation
```

---

### 2️⃣ **dependencies.py** - Dependency Injection

**Chức năng:**
- Cung cấp shared dependencies cho dependency injection
- Quản lý singletons (Supabase client, Router, Retriever)
- Authentication helpers (JWT verification - TODO)

**Dependencies được cung cấp:**
```python
get_supabase_client()    # Supabase client singleton
get_router()             # HybridRouter singleton
get_retriever()          # ParallelRetriever singleton
get_current_user()       # JWT authentication (TODO)
```

**Lợi ích:**
- Tránh tạo instance mới mỗi request (performance)
- Dễ mock khi testing
- Centralized configuration

---

### 3️⃣ **routes/** - HTTP Endpoint Layer (THIN)

**Chức năng:**
- Nhận HTTP request
- Validate input qua Pydantic schemas
- Gọi services với validated data
- Format response
- Handle HTTP status codes

**Nguyên tắc:**
```python
✅ Thin layer - minimal logic
✅ HTTP concerns only (status codes, headers)
✅ Delegate business logic to services
✅ Use Pydantic for validation
✅ Use dependency injection
```

**Ví dụ - routes/query.py:**
```python
@router.post("/query", response_model=QueryResponse)
async def process_query(
    request: QueryRequest,
    query_service: QueryService = Depends(get_query_service)
):
    # 1. Validate input (tự động qua Pydantic)
    # 2. Call service
    result = await query_service.process_query(
        query=request.query,
        max_docs=request.options.max_docs
    )
    # 3. Format response
    return QueryResponse(**result)
```

**Files trong routes/:**
- `query.py`: RAG query processing, route prediction, decomposition
- `health.py`: Health check cho API và components
- `authenticate/`: Authentication endpoints (login, register - TODO)

---

### 4️⃣ **services/** - Business Logic Layer (THICK)

**Chức năng:**
- Chứa TẤT CẢ business logic
- Orchestrate giữa nhiều repositories
- Transform data giữa các layers
- Không có HTTP concerns (có thể dùng ngoài API)

**Nguyên tắc:**
```python
✅ Thick layer - chứa logic phức tạp
✅ Orchestrate multiple repositories
✅ Transform data giữa layers
✅ Reusable (CLI, workers, tests)
✅ No HTTP/database dependencies
```

**Ví dụ - services/query_service.py:**
```python
class QueryService:
    def __init__(self, router, retriever):
        self.router = router
        self.retriever = retriever
    
    async def process_query(self, query: str) -> dict:
        # 1. Route query
        routes = self.router.route(query)
        
        # 2. Decompose if complex
        decomposition = await self._decompose(query)
        
        # 3. Retrieve documents
        docs = await self._retrieve(query, routes)
        
        # 4. Generate answer
        answer = await self._generate(docs)
        
        # 5. Format result
        return self._format_response(answer, docs, routes)
```

**Tại sao Services quan trọng:**
- Tách biệt business logic khỏi HTTP layer
- Có thể test độc lập không cần HTTP client
- Có thể dùng lại trong CLI, background jobs, etc.

---

### 5️⃣ **repositories/** - Data Access Layer

**Chức năng:**
- Pure data access - không có business logic
- CRUD operations với Supabase
- RPC function calls (vector search)
- Return Supabase schemas

**Nguyên tắc:**
```python
✅ Pure data access
✅ CRUD operations only
✅ Return database schemas
✅ No business logic
✅ No data transformation
```

**Files trong repositories/:**

**base.py** - Base Repository
```python
class BaseRepository:
    # Common CRUD operations
    async def find_by_id(id_field, id_value)
    async def find_all(limit, offset, order_by)
    async def create(data)
    async def update(id_field, id_value, data)
    async def delete(id_field, id_value)
    async def count(filters)
```

**vector_repo.py** - Vector Search Repository
```python
class VectorRepository:
    # RPC calls cho vector similarity search
    async def match_finance_documents(embedding, ...)
    async def match_news_documents(embedding, ...)
    async def match_legal_documents(embedding, ...)
    async def match_glossary(embedding, ...)
```

**Cách mở rộng:**
```python
# Tạo repository mới cho từng bảng
class UserRepository(BaseRepository):
    def __init__(self, supabase):
        super().__init__(supabase, "users")
    
    async def find_by_email(self, email: str):
        return await self.find_by_id("email", email)

class NewsRepository(BaseRepository):
    def __init__(self, supabase):
        super().__init__(supabase, "news")
    
    async def find_by_sentiment(self, sentiment: str):
        # Custom query logic
        ...
```

---

### 6️⃣ **schemas/** - Request/Response Models

**Chức năng:**
- Pydantic models cho API validation
- Khác với Supabase schemas (database structure)
- API-specific: có thể khác với database schema

**Phân biệt:**
```
supabase/schemas/     →  Database structure (mirror Supabase)
api/schemas/          →  API contracts (request/response)
```

**schemas/requests/** - Input Validation
```python
class QueryRequest(BaseModel):
    query: str = Field(min_length=1, max_length=2000)
    options: Optional[QueryOptions] = None

class QueryOptions(BaseModel):
    max_docs: int = Field(default=10, ge=1, le=50)
    include_sources: bool = True
    include_context: bool = False
```

**schemas/responses/** - Output Formatting
```python
class QueryResponse(BaseModel):
    answer: str
    is_grounded: bool
    citations: List[Citation]
    metadata: ResponseMetadata
    sources: Optional[List[Dict]]
    context: Optional[str]
```

**Lợi ích:**
- Auto validation
- Auto OpenAPI documentation
- Type hints cho IDE
- Clear API contracts

---

### 7️⃣ **middleware/** - Cross-cutting Concerns

**Chức năng:**
- Logic áp dụng cho TẤT CẢ requests/responses
- Không specific cho một endpoint

**middleware/logging.py:**
```python
async def log_requests_middleware(request, call_next):
    # Log request
    logger.info(f"{request.method} {request.url.path}")
    
    # Process request
    response = await call_next(request)
    
    # Log response + add headers
    response.headers["X-Process-Time"] = f"{time:.2f}ms"
    
    return response
```

**Các middleware khác (TODO):**
- `auth.py`: JWT verification, check permissions
- `rate_limit.py`: Rate limiting per user/IP
- `cors.py`: Advanced CORS handling (đã có trong main.py)

---

### 8️⃣ **exceptions/** - Error Handling

**Chức năng:**
- Custom exception classes
- Centralized exception handlers
- Consistent error responses

**exceptions/base.py:**
```python
class APIException(Exception):
    # Base exception với status_code, error_code, details
    
class NotFoundException(APIException):
    # 404 errors
    
class ValidationException(APIException):
    # 400 errors
    
class AuthenticationException(APIException):
    # 401 errors
```

**exceptions/handlers.py:**
```python
@app.exception_handler(APIException)
async def api_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.error_code, "message": exc.message}
    )
```

**Lợi ích:**
- Consistent error format
- Easy to raise errors: `raise NotFoundException("User not found")`
- Centralized error logging

---

## 🔄 Request Flow Example

```
1. Client gửi POST /api/query
   ↓
2. Middleware: log_requests_middleware
   ↓
3. Route: routes/query.py
   - Validate QueryRequest (Pydantic tự động)
   - Inject QueryService (dependency injection)
   ↓
4. Service: services/query_service.py
   - Route query → ["glossary", "financial"]
   - Decompose if complex
   - Call retriever to get documents
   - Generate grounded answer
   ↓
5. Repository: repositories/vector_repo.py
   - RPC call: match_glossary()
   - RPC call: match_finance_documents()
   - Return raw data
   ↓
6. Service: Transform data
   - Format citations
   - Build metadata
   ↓
7. Route: Format QueryResponse
   ↓
8. Middleware: Add X-Process-Time header
   ↓
9. Client nhận QueryResponse JSON
```

## 🚀 Chạy API

```bash
# Development (với reload)
python -m src.api.main

# Production (không reload)
uvicorn src.api.main:app --host 0.0.0.0 --port 8000

# Với workers
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 4
```

## 📝 Testing

```bash
# Health check
curl http://localhost:8000/api/health

# Query endpoint
curl -X POST http://localhost:8000/api/query \
  -H "Content-Type: application/json" \
  -d '{"query": "ROE là gì?"}'

# API docs
http://localhost:8000/docs
http://localhost:8000/redoc
```

## 🧪 Unit Testing Pattern

```python
# Test Service (mock repositories)
def test_query_service():
    mock_repo = Mock()
    service = QueryService(mock_router, mock_repo)
    result = await service.process_query("test")
    assert result["answer"]

# Test Repository (mock Supabase)
def test_vector_repo():
    mock_supabase = Mock()
    repo = VectorRepository(mock_supabase)
    docs = await repo.match_finance_documents(embedding)
    assert len(docs) > 0

# Test Route (mock service)
def test_query_route():
    mock_service = Mock()
    response = await process_query(request, mock_service)
    assert response.status_code == 200
```

## 📈 Mở rộng hệ thống

### Thêm endpoint mới:

1. **Tạo schemas** (requests + responses)
2. **Tạo repository** (nếu cần table mới)
3. **Tạo service** (business logic)
4. **Tạo route** (HTTP handling)
5. **Include router** trong main.py

### Thêm table/feature mới:

```python
# 1. Generate Supabase schema (nếu thêm bảng)
# 2. Tạo repository
class NewRepository(BaseRepository):
    def __init__(self, supabase):
        super().__init__(supabase, "new_table")

# 3. Tạo service
class NewService:
    def __init__(self, repo: NewRepository):
        self.repo = repo

# 4. Tạo routes
@router.get("/new")
async def get_new(service: NewService = Depends()):
    return await service.do_something()
```

## ✅ Best Practices

1. **Routes THIN, Services THICK**
   - Routes chỉ handle HTTP concerns
   - Services chứa tất cả logic

2. **Single Responsibility**
   - Mỗi class/function có 1 trách nhiệm duy nhất

3. **Dependency Injection**
   - Dùng Depends() để inject dependencies
   - Dễ test, dễ thay thế implementation

4. **Type Hints Everywhere**
   - Pydantic models cho validation
   - Type hints cho IDE support

5. **Error Handling**
   - Raise custom exceptions
   - Let handlers format responses

6. **Logging**
   - Log ở service layer (business events)
   - Log ở middleware (HTTP events)

## 🔐 Security (TODO)

- [ ] JWT authentication middleware
- [ ] Role-based access control (RBAC)
- [ ] Rate limiting per user
- [ ] Input sanitization
- [ ] SQL injection prevention (Supabase handles this)

## 📊 Monitoring (TODO)

- [ ] Prometheus metrics
- [ ] Request duration tracking
- [ ] Error rate monitoring
- [ ] Model performance metrics

---

**Last Updated:** January 7, 2026
**Architecture Pattern:** Routes → Services → Repositories
**Framework:** FastAPI 0.104+
**Database:** Supabase (PostgreSQL + pgvector)
