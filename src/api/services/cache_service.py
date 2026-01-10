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
    
    # =========================================================================
    # CHAT HISTORY METHODS - For conversation continuity
    # =========================================================================
    
    async def add_chat_message(
        self,
        user_id: str,
        role: str,
        content: str,
        max_messages: int = 20
    ) -> bool:
        """
        Add a message to user's chat history.
        
        Args:
            user_id: User UUID
            role: 'user' or 'assistant'
            content: Message content
            max_messages: Maximum messages to keep
            
        Returns:
            True if added successfully
        """
        if not self.is_connected:
            return False
        
        try:
            import time
            key = self._get_history_key(user_id)
            message = json.dumps({
                "role": role,
                "content": content,
                "ts": time.time()
            }, ensure_ascii=False)
            
            # Push to front (newest first)
            self._client.lpush(key, message)
            # Trim to max size
            self._client.ltrim(key, 0, max_messages - 1)
            # Set/extend TTL
            self._client.expire(key, self.DEFAULT_TTL)
            
            return True
            
        except Exception as e:
            logger.error(f"Error adding chat message: {e}")
            return False
    
    async def get_chat_history(
        self,
        user_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get recent chat history for conversation context.
        
        Args:
            user_id: User UUID
            limit: Number of recent messages to return
            
        Returns:
            List of messages in chronological order (oldest first)
        """
        if not self.is_connected:
            return []
        
        try:
            key = self._get_history_key(user_id)
            messages = self._client.lrange(key, 0, limit - 1)
            
            # Parse and reverse (oldest first for context)
            parsed = [json.loads(m) for m in messages]
            return parsed[::-1]
            
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []
    
    # =========================================================================
    # RETRIEVED IDS TRACKING - For incremental retrieval
    # =========================================================================
    
    def _get_retrieved_key(self, user_id: str) -> str:
        """Generate cache key for retrieved doc IDs."""
        return f"chat:retrieved:{user_id}"
    
    async def get_retrieved_ids(self, user_id: str) -> set:
        """
        Get set of doc IDs already retrieved for this user session.
        
        Args:
            user_id: User UUID
            
        Returns:
            Set of doc IDs
        """
        if not self.is_connected:
            return set()
        
        try:
            key = self._get_retrieved_key(user_id)
            ids = self._client.smembers(key)
            return set(ids) if ids else set()
            
        except Exception as e:
            logger.error(f"Error getting retrieved IDs: {e}")
            return set()
    
    async def add_retrieved_ids(
        self,
        user_id: str,
        doc_ids: List[str]
    ) -> bool:
        """
        Add doc IDs to the retrieved set.
        
        Args:
            user_id: User UUID
            doc_ids: List of doc IDs to add
            
        Returns:
            True if added successfully
        """
        if not self.is_connected or not doc_ids:
            return False
        
        try:
            key = self._get_retrieved_key(user_id)
            self._client.sadd(key, *[str(id) for id in doc_ids])
            self._client.expire(key, self.DEFAULT_TTL)
            return True
            
        except Exception as e:
            logger.error(f"Error adding retrieved IDs: {e}")
            return False
    
    async def clear_retrieved_ids(self, user_id: str) -> bool:
        """Clear retrieved IDs for a new conversation."""
        if not self.is_connected:
            return False
        
        try:
            key = self._get_retrieved_key(user_id)
            self._client.delete(key)
            return True
            
        except Exception as e:
            logger.error(f"Error clearing retrieved IDs: {e}")
            return False
    
    # =========================================================================
    # RAG CACHE - For caching pipeline results (facts + entities)
    # =========================================================================
    
    def _get_rag_cache_key(self, user_id: str) -> str:
        """Generate cache key for RAG results."""
        return f"chat:rag_cache:{user_id}"
    
    async def set_rag_cache(
        self,
        user_id: str,
        data: Dict[str, Any],
        ttl: int = None
    ) -> bool:
        """
        Cache RAG pipeline results (extracted facts, entities).
        
        Args:
            user_id: User UUID
            data: RAG results {entities: [...], facts: [...], last_query: "..."}
            ttl: Time to live in seconds
            
        Returns:
            True if cached successfully
        """
        if not self.is_connected:
            return False
        
        try:
            import time
            key = self._get_rag_cache_key(user_id)
            ttl = ttl or self.DEFAULT_TTL
            
            # Add timestamp
            data["cached_at"] = time.time()
            
            self._client.setex(
                key,
                ttl,
                json.dumps(data, ensure_ascii=False)
            )
            logger.info(f"Cached RAG results for user {user_id}: {len(data.get('entities', []))} entities, {len(data.get('facts', []))} facts")
            return True
            
        except Exception as e:
            logger.error(f"Error caching RAG results: {e}")
            return False
    
    async def get_rag_cache(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Get cached RAG results.
        
        Args:
            user_id: User UUID
            
        Returns:
            Cached RAG data or None
        """
        if not self.is_connected:
            return None
        
        try:
            key = self._get_rag_cache_key(user_id)
            data = self._client.get(key)
            
            if data:
                parsed = json.loads(data)
                logger.debug(f"RAG cache hit for user {user_id}")
                return parsed
            return None
            
        except Exception as e:
            logger.error(f"Error getting RAG cache: {e}")
            return None
    
    async def append_rag_cache(
        self,
        user_id: str,
        new_entities: List[str],
        new_facts: List[Dict]
    ) -> bool:
        """
        Append new entities and facts to existing RAG cache.
        
        Args:
            user_id: User UUID
            new_entities: New entities to add
            new_facts: New facts to add
            
        Returns:
            True if updated successfully
        """
        if not self.is_connected:
            return False
        
        try:
            existing = await self.get_rag_cache(user_id) or {"entities": [], "facts": []}
            
            # Merge entities (unique)
            all_entities = list(set(existing.get("entities", []) + new_entities))
            
            # Merge facts (append)
            all_facts = existing.get("facts", []) + new_facts
            
            # Update cache
            await self.set_rag_cache(user_id, {
                "entities": all_entities,
                "facts": all_facts,
                "last_query": existing.get("last_query")
            })
            return True
            
        except Exception as e:
            logger.error(f"Error appending RAG cache: {e}")
            return False
    
    async def clear_rag_cache(self, user_id: str) -> bool:
        """Clear RAG cache for user."""
        if not self.is_connected:
            return False
        
        try:
            key = self._get_rag_cache_key(user_id)
            self._client.delete(key)
            return True
            
        except Exception as e:
            logger.error(f"Error clearing RAG cache: {e}")
            return False


# Singleton instance
_cache_service: Optional[CacheService] = None


def get_cache_service() -> CacheService:
    """Get or create cache service singleton."""
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
