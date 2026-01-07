"""
FastAPI Dependencies.

Shared dependencies for dependency injection across routes.
"""
import os
from functools import lru_cache
from typing import Optional

from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()


@lru_cache()
def get_supabase_client() -> Client:
    """
    Get Supabase client singleton.
    
    Returns:
        Initialized Supabase client
    """
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    if not url or not key:
        raise RuntimeError("SUPABASE_URL and SUPABASE_KEY must be set")
    
    return create_client(url, key)


def get_current_user() -> Optional[str]:
    """
    Get current user from JWT token (placeholder).
    
    TODO: Implement JWT verification
    Returns:
        User ID if authenticated, None otherwise
    """
    # TODO: Extract from Authorization header, verify JWT
    return None


# Singletons for heavy models (lazy initialization)
_router_instance = None
_retriever_instance = None


def get_router():
    """Get or create HybridRouter singleton."""
    global _router_instance
    if _router_instance is None:
        from src.core.router import HybridRouter
        _router_instance = HybridRouter()
    return _router_instance


def get_retriever():
    """Get or create ParallelRetriever singleton."""
    global _retriever_instance
    if _retriever_instance is None:
        from src.core.retrieval import ParallelRetriever
        _retriever_instance = ParallelRetriever()
    return _retriever_instance
