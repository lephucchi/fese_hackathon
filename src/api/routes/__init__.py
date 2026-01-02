"""
API Routes Package.
"""
from .query import router as query_router
from .health import router as health_router

__all__ = ["query_router", "health_router"]
