"""
Health Check Route Handler.
"""
import logging
import os
from fastapi import APIRouter

from ..schemas import HealthResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Check API health status",
    description="Returns the health status of API and its dependencies."
)
async def health():
    """Check health of all components."""
    components = {}
    overall_status = "healthy"
    
    # Check Supabase
    try:
        supabase_url = os.getenv("supabase_url", "")
        if supabase_url:
            components["supabase"] = "configured"
        else:
            components["supabase"] = "not_configured"
            overall_status = "degraded"
    except Exception as e:
        components["supabase"] = f"error: {str(e)}"
        overall_status = "unhealthy"
    
    # Check Gemini
    try:
        gemini_key = os.getenv("GEMINI_API_KEY", "")
        if gemini_key:
            components["gemini"] = "configured"
        else:
            components["gemini"] = "not_configured"
            overall_status = "degraded"
    except Exception as e:
        components["gemini"] = f"error: {str(e)}"
        overall_status = "unhealthy"
    
    # Check LangGraph
    try:
        from langgraph.graph import StateGraph
        components["langgraph"] = "available"
    except ImportError:
        components["langgraph"] = "not_installed"
        overall_status = "degraded"
    
    # Check Router (lazy check)
    components["router"] = "lazy_loaded"
    
    return HealthResponse(
        status=overall_status,
        components=components,
        version="1.0.0"
    )


@router.get(
    "/routes",
    summary="Get available indices",
    description="Returns the list of available vector indices."
)
async def get_routes():
    """Get available routing indices."""
    return {
        "indices": [
            {"name": "glossary", "description": "Definitions and terminology"},
            {"name": "legal", "description": "Laws and regulations"},
            {"name": "financial", "description": "Company financials"},
            {"name": "news", "description": "Market news and trends"},
        ]
    }
