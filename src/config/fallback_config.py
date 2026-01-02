"""
Configuration module for External Search Fallback.

Centralizes all configuration for the fallback mechanism,
following the Single Responsibility Principle.
"""
import os
from dataclasses import dataclass, field
from typing import List
from dotenv import load_dotenv

load_dotenv()


def _get_gemini_model() -> str:
    """Get Gemini model from environment, fallback to default."""
    return os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")


@dataclass(frozen=True)
class FallbackConfig:
    """
    Immutable configuration for External Search Fallback.
    
    Attributes:
        enabled: Feature flag to enable/disable fallback
        relevance_threshold: Minimum similarity score to skip fallback
        min_docs_required: Minimum docs needed to skip fallback
        temporal_keywords: Keywords that trigger temporal fallback
        search_model: Gemini model for Google Search grounding
        search_temperature: LLM temperature for search
        max_search_results: Maximum web results to include
        timeout_seconds: Timeout for fallback operations
    """
    # Feature flag
    enabled: bool = True
    
    # Thresholds
    relevance_threshold: float = 0.45
    min_docs_required: int = 1
    
    # Temporal detection keywords (Vietnamese + English)
    temporal_keywords: tuple = (
        # Vietnamese
        "hôm nay", "hôm qua", "tuần này", "tuần trước",
        "tháng này", "tháng trước", "năm nay",
        "mới nhất", "gần đây", "hiện tại", "hiện nay",
        "vừa rồi", "vừa qua", "sáng nay", "chiều nay",
        # English
        "today", "yesterday", "this week", "last week",
        "this month", "last month", "this year",
        "latest", "recent", "recently", "current", "now",
        # Year patterns
        "2024", "2025", "2026",
    )
    
    # Google Search settings
    search_model: str = field(default_factory=_get_gemini_model)
    search_temperature: float = 0.0
    max_search_results: int = 5
    timeout_seconds: float = 15.0
    
    @classmethod
    def from_env(cls) -> "FallbackConfig":
        """Create config from environment variables."""
        return cls(
            enabled=os.getenv("FALLBACK_ENABLED", "true").lower() in ("true", "1", "yes"),
            relevance_threshold=float(os.getenv("FALLBACK_RELEVANCE_THRESHOLD", "0.45")),
            min_docs_required=int(os.getenv("FALLBACK_MIN_DOCS", "1")),
            search_model=_get_gemini_model(),
            search_temperature=float(os.getenv("FALLBACK_SEARCH_TEMPERATURE", "0.0")),
            max_search_results=int(os.getenv("FALLBACK_MAX_RESULTS", "5")),
            timeout_seconds=float(os.getenv("FALLBACK_TIMEOUT", "15.0")),
        )


# Singleton instance
_config: FallbackConfig = None


def get_fallback_config() -> FallbackConfig:
    """Get or create the fallback configuration."""
    global _config
    if _config is None:
        _config = FallbackConfig.from_env()
    return _config
