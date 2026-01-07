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
    description="Check API and component health status"
)
async def health_check():
    """
    Check health status of API and its components.
    
    Returns:
        Health status with component details
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
