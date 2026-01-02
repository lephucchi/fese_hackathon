"""
Configuration for Semantic Router.
"""
from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class RouterConfig:
    """Configuration for the Semantic Router."""
    
    # Embedding model - same as index embeddings for consistency
    encoder_model: str = "BAAI/bge-m3"
    
    # Routing thresholds - lowered for Vietnamese queries
    default_threshold: float = 0.30
    route_thresholds: Dict[str, float] = field(default_factory=dict)
    
    # Multi-label settings
    enable_multi_label: bool = True
    max_routes: int = 4  # Maximum routes per query (supports 2-4 indices)
    multi_label_threshold: float = 0.25  # Lower threshold for secondary routes
    
    # Fallback
    fallback_route: str = "financial"  # Default when no match
    
    # Performance
    cache_embeddings: bool = True
    normalize_embeddings: bool = True
    
    def __post_init__(self):
        """Set default per-route thresholds if not provided."""
        if not self.route_thresholds:
            self.route_thresholds = {
                "glossary": 0.30,   # Lowered for Vietnamese queries
                "legal": 0.28,      # Lowered - legal should be accessible
                "financial": 0.28,  # Lowered - broad financial queries
                "news": 0.35,       # Slightly higher - news needs relevance
            }


# Default configuration instance
DEFAULT_CONFIG = RouterConfig()


# Presets for different use cases
FAST_CONFIG = RouterConfig(
    encoder_model="BAAI/bge-m3",
    enable_multi_label=False,  # Single label only for speed
    max_routes=1,
)

ACCURATE_CONFIG = RouterConfig(
    encoder_model="BAAI/bge-m3",
    enable_multi_label=True,
    max_routes=4,
    default_threshold=0.60,  # Lower to catch more
    multi_label_threshold=0.50,
)
