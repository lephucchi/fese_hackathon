"""
Router Module - Semantic and Hybrid Query Routing.

Provides intelligent routing of queries to appropriate vector indices.
"""
from .router import SemanticRouter, HybridRouter, create_router
from .routes import Route, ROUTES

__all__ = [
    "SemanticRouter",
    "HybridRouter",
    "create_router",
    "Route",
    "ROUTES",
]
