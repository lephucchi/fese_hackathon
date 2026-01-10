"""
Health check routes.
"""
import logging
from fastapi import APIRouter

from ..schemas.responses import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"], prefix="/health")


@router.get(
    "",
    response_model=HealthResponse,
    summary="Health check",
    description="Lightweight health check - does not load models"
)
async def health_check():
    """
    Lightweight health check for container orchestration.
    
    Returns API status without loading heavy models.
    For detailed component health, use /health/detailed endpoint.
    
    Returns:
        Basic health status
    """
    return HealthResponse(
        status="healthy",
        components={
            "api": "healthy",
            "models": "lazy_loaded"
        },
        version="1.0.0"
    )


@router.get(
    "/detailed",
    response_model=HealthResponse,
    summary="Detailed health check",
    description="Check API and all component health (loads models)"
)
async def detailed_health_check():
    """
    Detailed health check - instantiates and tests all components.
    
    WARNING: This endpoint loads models and may take time on first call.
    
    Returns:
        Detailed health status with component checks
    """
    components = {}
    overall_status = "healthy"
    
    # Check router
    try:
        from src.core.router import HybridRouter
        router_instance = HybridRouter()
        _ = router_instance.route("test")
        components["router"] = "healthy"
    except Exception as e:
        logger.error(f"Router health check failed: {e}")
        components["router"] = "unhealthy"
        overall_status = "degraded"
    
    # Check retriever
    try:
        from src.core.retrieval import ParallelRetriever
        retriever = ParallelRetriever()
        components["retriever"] = "healthy"
    except Exception as e:
        logger.error(f"Retriever health check failed: {e}")
        components["retriever"] = "unhealthy"
        overall_status = "degraded"
    
    # Check generator
    try:
        from src.core.generator import GroundedGenerator
        generator = GroundedGenerator()
        components["generator"] = "healthy"
    except Exception as e:
        logger.error(f"Generator health check failed: {e}")
        components["generator"] = "unhealthy"
        overall_status = "degraded"
    
    return HealthResponse(
        status=overall_status,
        components=components,
        version="1.0.0"
    )
