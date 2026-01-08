"""
Cache Service - Redis cache for chat context.

Provides context caching for chat conversations.
"""
import os
import json
import logging
from typing import Optional, Dict, Any, List

try:
    import redis
except ImportError:
    redis = None

from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)


class CacheService:
    """
    Redis cache service for chat context.
    
    Caches user's interested news context for chat conversations.
    """
    
    DEFAULT_TTL = 1800  # 30 minutes
    
    def __init__(self, redis_url: Optional[str] = None):
        """
        Initialize cache service.
        
        Args:
            redis_url: Redis connection URL (defaults to env REDIS_URL)
        """
        self.redis_url = redis_url or os.getenv("REDIS_URL", "redis://localhost:6379")
        self._client: Optional[redis.Redis] = None
        self._connected = False
        
        # Try to connect
        self._connect()
    
    def _connect(self) -> bool:
        """Establish Redis connection."""
        if redis is None:
            logger.warning("Redis package not installed. Cache disabled.")
            return False
        
        try:
            self._client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=5
            )
            # Test connection
            self._client.ping()
            self._connected = True
            logger.info(f"Redis connected: {self.redis_url}")
            return True
            
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Cache disabled.")
            self._connected = False
            return False
    
    @property
    def is_connected(self) -> bool:
        """Check if Redis is connected."""
        return self._connected and self._client is not None
    
    def _get_context_key(self, user_id: str) -> str:
        """Generate cache key for user context."""
        return f"chat:context:{user_id}"
    
    def _get_history_key(self, user_id: str) -> str:
        """Generate cache key for chat history."""
        return f"chat:history:{user_id}"
    
    async def set_context(
        self,
        user_id: str,
        context: Dict[str, Any],
        ttl: int = None
    ) -> bool:
        """
        Cache user's chat context.
        
        Args:
            user_id: User UUID
            context: Context data (news analyst, tickers, etc.)
            ttl: Time to live in seconds (default 30 min)
            
        Returns:
            True if cached successfully
        """
        if not self.is_connected:
            return False
        
        try:
            key = self._get_context_key(user_id)
            ttl = ttl or self.DEFAULT_TTL
            
            self._client.setex(
                key,
                ttl,
                json.dumps(context, ensure_ascii=False)
            )
            logger.debug(f"Cached context for user {user_id}, TTL={ttl}s")
            return True
            
        except Exception as e:
            logger.error(f"Error caching context: {e}")
            return False
    
    async def get_context(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached context for user.
        
        Args:
            user_id: User UUID
            
        Returns:
            Cached context dict or None
        """
        if not self.is_connected:
            return None
        
        try:
            key = self._get_context_key(user_id)
            data = self._client.get(key)
            
            if data:
                return json.loads(data)
            return None
            
        except Exception as e:
            logger.error(f"Error getting context: {e}")
            return None
    
    async def clear_context(self, user_id: str) -> bool:
        """
        Clear cached context for user.
        
        Args:
            user_id: User UUID
            
        Returns:
            True if cleared
        """
        if not self.is_connected:
            return False
        
        try:
            key = self._get_context_key(user_id)
            self._client.delete(key)
            logger.debug(f"Cleared context for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error clearing context: {e}")
            return False
    
    async def extend_ttl(self, user_id: str, ttl: int = None) -> bool:
        """
        Extend TTL for user's context.
        
        Args:
            user_id: User UUID
            ttl: New TTL in seconds
            
        Returns:
            True if extended
        """
        if not self.is_connected:
            return False
        
        try:
            key = self._get_context_key(user_id)
            ttl = ttl or self.DEFAULT_TTL
            self._client.expire(key, ttl)
            return True
            
        except Exception as e:
            logger.error(f"Error extending TTL: {e}")
            return False


# Singleton instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get or create cache service singleton."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
