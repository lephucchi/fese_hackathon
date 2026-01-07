"""
API Routes Package.
"""
from .query import router as query_router
from .health import router as health_router
from .auth import router as auth_router
from .users import router as users_router
from .admin import router as admin_router
from .news import router as news_router
from .interactions import router as interactions_router

__all__ = [
    "query_router",
    "health_router",
    "auth_router",
    "users_router",
    "admin_router",
    "news_router",
    "interactions_router",
]
