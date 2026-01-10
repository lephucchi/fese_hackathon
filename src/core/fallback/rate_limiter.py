"""
Rate Limiter for Fallback to prevent abuse.

Prevents:
- Excessive fallback calls (cost control)
- Abuse from malicious users
- API quota exhaustion
"""
import time
import logging
from typing import Dict, Optional
from dataclasses import dataclass
from collections import defaultdict, deque

logger = logging.getLogger(__name__)


@dataclass
class RateLimitResult:
    """Result of rate limit check."""
    allowed: bool
    reason: str
    retry_after: Optional[int] = None
    current_count: int = 0
    limit: int = 0
    
    def to_dict(self):
        return {
            "allowed": self.allowed,
            "reason": self.reason,
            "retry_after": self.retry_after,
            "current_count": self.current_count,
            "limit": self.limit
        }


class FallbackRateLimiter:
    """
    Rate limiter for fallback Google Search calls.
    
    Implements sliding window rate limiting:
    - Track calls per user_id
    - Configurable limit and window
    - Clean up old entries automatically
    """
    
    def __init__(
        self,
        limit_per_user: int = 5,
        window_seconds: int = 3600
    ):
        self.limit = limit_per_user
        self.window = window_seconds
        self._calls: Dict[str, deque] = defaultdict(lambda: deque())
        
        logger.info(
            f"FallbackRateLimiter initialized: "
            f"{limit_per_user} calls per {window_seconds}s"
        )
    
    def check_limit(self, user_id: str) -> RateLimitResult:
        """Check if user can make a fallback call."""
        now = time.time()
        calls = self._calls[user_id]
        
        # Remove calls outside window
        while calls and calls[0] < now - self.window:
            calls.popleft()
        
        current_count = len(calls)
        
        if current_count >= self.limit:
            oldest_call = calls[0]
            retry_after = int(oldest_call + self.window - now)
            
            logger.warning(
                f"Rate limit exceeded for user {user_id}: "
                f"{current_count}/{self.limit} calls in window"
            )
            
            return RateLimitResult(
                allowed=False,
                reason=f"Rate limit exceeded: {current_count}/{self.limit}",
                retry_after=retry_after,
                current_count=current_count,
                limit=self.limit
            )
        
        # Allow and record call
        calls.append(now)
        
        return RateLimitResult(
            allowed=True,
            reason="Within rate limit",
            current_count=current_count + 1,
            limit=self.limit
        )
    
    def get_stats(self) -> dict:
        """Get rate limiter statistics."""
        now = time.time()
        total_users = len(self._calls)
        total_calls = sum(
            len([ts for ts in calls if ts > now - self.window])
            for calls in self._calls.values()
        )
        
        return {
            "total_users": total_users,
            "total_calls_in_window": total_calls,
            "limit_per_user": self.limit,
            "window_seconds": self.window
        }


# Singleton instance
_fallback_limiter: Optional[FallbackRateLimiter] = None


def get_fallback_limiter(
    limit_per_user: int = 5,
    window_seconds: int = 3600
) -> FallbackRateLimiter:
    """Get or create FallbackRateLimiter singleton."""
    global _fallback_limiter
    
    if _fallback_limiter is None:
        _fallback_limiter = FallbackRateLimiter(
            limit_per_user=limit_per_user,
            window_seconds=window_seconds
        )
    
    return _fallback_limiter
