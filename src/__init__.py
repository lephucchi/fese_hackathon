"""
Multi-Index RAG System for Vietnamese Financial Data.

This package provides a complete RAG pipeline with:
- Semantic routing to 4 specialized indices
- Query decomposition for complex queries
- Parallel vector retrieval from Supabase
- Grounded answer generation with citations

Modules:
- config: Centralized configuration
- core: Business logic (router, decomposition, retrieval, generator)
- pipeline: LangGraph orchestration
- api: FastAPI endpoints
- utils: Shared utilities
"""

__version__ = "1.0.0"

# Convenience imports
from .core import HybridRouter, QueryDecomposer, ParallelRetriever, ResultFusion

__all__ = [
    "__version__",
    "HybridRouter",
    "QueryDecomposer",
    "ParallelRetriever",
    "ResultFusion",
]
