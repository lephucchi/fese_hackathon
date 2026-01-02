"""
FastAPI Application Entry Point.

Multi-Index RAG API for Vietnamese Financial & Legal Data.
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
    # Startup: Pre-warm models to eliminate cold start latency
    # =========================================================================
    try:
        logger.info("Pre-warming models...")
        
        # 1. Pre-warm router
        from src.core.router import HybridRouter
        router = HybridRouter()
        _ = router.route("warmup query")
        logger.info("✓ Router pre-warmed")
        
        # 2. Pre-warm retriever encoder
        from src.core.retrieval import ParallelRetriever
        retriever = ParallelRetriever()
        _ = retriever.retrieve("warmup", "glossary", k=1)
        logger.info("✓ Retriever encoder pre-warmed")
        
        # 3. Initialize embedding cache
        from src.core.retrieval import get_embedding_cache
        cache = get_embedding_cache(maxsize=1000)
        logger.info(f"✓ Embedding cache initialized (maxsize={cache.maxsize})")
        
        logger.info("All models pre-warmed successfully!")
        
    except Exception as e:
        logger.warning(f"Pre-warming failed (non-critical): {e}")
    
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
    - ✅ Multi-label routing
    - ✅ Query decomposition for complex questions
    - ✅ Parallel retrieval
    - ✅ Grounded generation with citations
    """,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
from .routes import query_router, health_router

app.include_router(query_router, prefix="/api")
app.include_router(health_router, prefix="/api")


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API root - redirect to docs."""
    return {
        "name": "Multi-Index RAG API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/health"
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle uncaught exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": "internal_error",
            "message": "An unexpected error occurred. Please try again."
        }
    )


# For running directly
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
