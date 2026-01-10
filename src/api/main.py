"""
FastAPI Application Entry Point - Refactored.

Multi-Index RAG API for Vietnamese Financial & Legal Data.

Architecture:
- Routes: Thin layer for request/response handling
- Services: Business logic and orchestration
- Repositories: Data access layer (Supabase)
- Middleware: Cross-cutting concerns (logging, auth, rate limiting)
- Exceptions: Centralized error handling
"""
import os
import logging
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler with model pre-warming."""
    logger.info("Starting Multi-Index RAG API...")
    
    # =========================================================================
    # Startup: Pre-warm models (DISABLED for faster startup on CPU)
    # Models will be lazy-loaded on first request
    # =========================================================================
    logger.info("Skipping pre-warming for faster startup. Models will load on first request.")
    
    # # Uncomment to enable pre-warming (recommended for GPU deployments)
    # try:
    #     logger.info("Pre-warming models...")
    #     
    #     # 1. Pre-warm router
    #     from src.core.router import HybridRouter
    #     router = HybridRouter()
    #     _ = router.route("warmup query")
    #     logger.info("✓ Router pre-warmed")
    #     
    #     # 2. Pre-warm retriever encoder
    #     from src.core.retrieval import ParallelRetriever
    #     retriever = ParallelRetriever()
    #     _ = retriever.retrieve("warmup", "glossary", k=1)
    #     logger.info("✓ Retriever encoder pre-warmed")
    #     
    #     # 3. Initialize embedding cache
    #     from src.core.retrieval import get_embedding_cache
    #     cache = get_embedding_cache(maxsize=1000)
    #     logger.info(f"✓ Embedding cache initialized (maxsize={cache.maxsize})")
    #     
    #     logger.info("All models pre-warmed successfully!")
    #     
    # except Exception as e:
    #     logger.warning(f"Pre-warming failed (non-critical): {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down API...")


# Create FastAPI app
app = FastAPI(
    title="Multi-Index RAG API",
    description="""
    ## Semantic-Router RAG System for Vietnamese Financial & Legal Data
    
    This API provides intelligent query routing and grounded answer generation
    across 4 specialized vector indices:
    
    - **Glossary** - Financial/legal terminology
    - **Legal** - Laws, regulations, decrees
    - **Financial** - Company financials, reports
    - **News** - Market news, trends
    
    ### Features
    - ✅ Multi-label routing with semantic classification
    - ✅ Query decomposition for complex questions
    - ✅ Parallel retrieval across multiple indices
    - ✅ Grounded generation with citations
    - ✅ Clean architecture: Routes → Services → Repositories
    
    ### Architecture
    - **Routes**: Thin layer for HTTP handling
    - **Services**: Business logic and orchestration
    - **Repositories**: Data access (Supabase)
    - **Schemas**: Request/Response validation
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# =========================================================================
# CORS Configuration
# =========================================================================
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================================================================
# Custom Middleware
# =========================================================================
from src.api.middleware import log_requests_middleware

app.middleware("http")(log_requests_middleware)

# =========================================================================
# Exception Handlers
# =========================================================================
from src.api.exceptions import register_exception_handlers

register_exception_handlers(app)

# =========================================================================
# Include Routers
# =========================================================================
from src.api.routes.query import router as query_router
from src.api.routes.health import router as health_router
from src.api.routes.auth import router as auth_router
from src.api.routes.users import router as users_router
from src.api.routes.admin import router as admin_router
from src.api.routes.news import router as news_router
from src.api.routes.interactions import router as interactions_router
from src.api.routes.market import router as market_router
from src.api.routes.portfolio import router as portfolio_router

app.include_router(query_router, prefix="/api")
app.include_router(health_router, prefix="/api")
app.include_router(auth_router, prefix="/api")
app.include_router(users_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(news_router, prefix="/api")
app.include_router(interactions_router, prefix="/api")
app.include_router(market_router, prefix="/api")
app.include_router(portfolio_router, prefix="/api")



# =========================================================================
# Root Endpoint
# =========================================================================
@app.get("/", tags=["Root"])
async def root():
    """API root - redirect to docs."""
    return {
        "name": "Multi-Index RAG API",
        "version": "1.0.0",
        "architecture": "Routes → Services → Repositories",
        "docs": "/docs",
        "health": "/api/health"
    }


# =========================================================================
# Run Directly (Development)
# =========================================================================
if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    
    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        reload=True
    )
    print("API started on http://{}:{}/docs".format(host, port))
    print("API started on http://{}:{}/docs".format(host, port))
    
