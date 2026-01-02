"""
Retrieval Module - Parallel Vector Search and Result Fusion.

Provides async parallel retrieval from multiple Supabase indices.
"""
from .parallel import ParallelRetriever, RetrievalResult, RetrievedDocument
from .fusion import ResultFusion, FusedContext, FusionStrategy
from .translator import QueryTranslator, get_translator, translate_for_glossary
from .cache import EmbeddingCache, get_embedding_cache, CacheStats, reset_cache

__all__ = [
    "ParallelRetriever",
    "RetrievalResult",
    "RetrievedDocument",
    "ResultFusion",
    "FusedContext",
    "FusionStrategy",
    "QueryTranslator",
    "get_translator",
    "translate_for_glossary",
    # Cache
    "EmbeddingCache",
    "get_embedding_cache",
    "CacheStats",
    "reset_cache",
]

