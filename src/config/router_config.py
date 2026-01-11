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
    
    # Routing thresholds - tuned for Vietnamese queries
    default_threshold: float = 0.32
    route_thresholds: Dict[str, float] = field(default_factory=dict)
    
    # Multi-label settings
    enable_multi_label: bool = True
    max_routes: int = 3  # Maximum routes per query (reduced to avoid noise)
    multi_label_threshold: float = 0.32  # Higher threshold for secondary routes
    
    # Fallback
    fallback_route: str = "financial"  # Default when no match
    
    # Performance
    cache_embeddings: bool = True
    normalize_embeddings: bool = True
    
    def __post_init__(self):
        """Set default per-route thresholds if not provided."""
        if not self.route_thresholds:
            self.route_thresholds = {
                "glossary": 0.35,   # Higher - glossary should be explicit
                "legal": 0.32,      # Legal queries need clarity
                "financial": 0.30,  # Lower - broad financial queries
                "news": 0.35,       # Higher - news needs relevance
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
