"""
Embedding Cache Module.

Provides LRU caching for query embeddings to improve latency.
"""
import hashlib
import logging
import numpy as np
from typing import Dict, Optional, Any
from collections import OrderedDict
from dataclasses import dataclass, field
from datetime import datetime

logger = logging.getLogger(__name__)


@dataclass
class CacheStats:
    """Statistics for cache performance monitoring."""
    hits: int = 0
    misses: int = 0
    evictions: int = 0
    total_queries: int = 0
    
    @property
    def hit_rate(self) -> float:
        if self.total_queries == 0:
            return 0.0
        return self.hits / self.total_queries
    
    def to_dict(self) -> dict:
        return {
            "hits": self.hits,
            "misses": self.misses,
            "evictions": self.evictions,
            "total_queries": self.total_queries,
            "hit_rate": round(self.hit_rate, 4)
        }


class EmbeddingCache:
    """
    LRU cache for query embeddings.
    
    Caches computed embeddings to avoid redundant encoding operations,
    significantly reducing latency for repeated or similar queries.
    
    Example:
        >>> cache = EmbeddingCache(maxsize=1000)
        >>> emb = cache.get_or_compute("ROE là gì", encoder)
        >>> emb2 = cache.get_or_compute("ROE là gì", encoder)  # Cache hit!
        >>> print(cache.stats.hit_rate)
        0.5
    """
    
    def __init__(self, maxsize: int = 1000):
        """
        Initialize cache with maximum size.
        
        Args:
            maxsize: Maximum number of embeddings to cache
        """
        self.maxsize = maxsize
        self._cache: OrderedDict[str, np.ndarray] = OrderedDict()
        self.stats = CacheStats()
    
    def _hash_query(self, query: str) -> str:
        """Generate hash key for a query."""
        return hashlib.md5(query.strip().lower().encode('utf-8')).hexdigest()
    
    def get(self, query: str) -> Optional[np.ndarray]:
        """
        Get cached embedding if exists.
        
        Args:
            query: Query string
            
        Returns:
            Cached embedding or None if not found
        """
        key = self._hash_query(query)
        if key in self._cache:
            # Move to end (most recently used)
            self._cache.move_to_end(key)
            self.stats.hits += 1
            self.stats.total_queries += 1
            return self._cache[key]
        return None
    
    def put(self, query: str, embedding: np.ndarray):
        """
        Store embedding in cache.
        
        Args:
            query: Query string
            embedding: Computed embedding vector
        """
        key = self._hash_query(query)
        
        # If key exists, update and move to end
        if key in self._cache:
            self._cache.move_to_end(key)
            self._cache[key] = embedding
            return
        
        # Evict oldest if at capacity
        if len(self._cache) >= self.maxsize:
            self._cache.popitem(last=False)
            self.stats.evictions += 1
        
        self._cache[key] = embedding
    
    def get_or_compute(
        self, 
        query: str, 
        encoder: Any,
        normalize: bool = True
    ) -> np.ndarray:
        """
        Get embedding from cache or compute if not found.
        
        Args:
            query: Query string
            encoder: Encoder with .encode() method
            normalize: Whether to normalize the embedding
            
        Returns:
            Embedding vector
        """
        # Try cache first
        cached = self.get(query)
        if cached is not None:
            logger.debug(f"Cache hit for query: {query[:30]}...")
            return cached
        
        # Compute and cache
        self.stats.misses += 1
        self.stats.total_queries += 1
        
        embedding = encoder.encode(
            query,
            normalize_embeddings=normalize,
            show_progress_bar=False
        )
        
        self.put(query, embedding)
        return embedding
    
    def clear(self):
        """Clear all cached embeddings."""
        self._cache.clear()
        logger.info("Embedding cache cleared")
    
    def __len__(self) -> int:
        return len(self._cache)
    
    def __contains__(self, query: str) -> bool:
        key = self._hash_query(query)
        return key in self._cache


# Global cache instance (singleton pattern)
_global_cache: Optional[EmbeddingCache] = None


def get_embedding_cache(maxsize: int = 1000) -> EmbeddingCache:
    """
    Get or create global embedding cache.
    
    Args:
        maxsize: Maximum cache size (only used on first call)
        
    Returns:
        Global EmbeddingCache instance
    """
    global _global_cache
    if _global_cache is None:
        _global_cache = EmbeddingCache(maxsize=maxsize)
        logger.info(f"Created global embedding cache with maxsize={maxsize}")
    return _global_cache


def reset_cache():
    """Reset the global cache."""
    global _global_cache
    if _global_cache:
        _global_cache.clear()
    _global_cache = None
