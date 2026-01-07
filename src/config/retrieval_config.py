"""
Configuration module for Retrieval.

Centralizes all configuration for parallel retrieval and fusion.
"""
import os
from dataclasses import dataclass
from typing import Dict
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class RetrieverConfig:
    """
    Configuration for ParallelRetriever.
    
    Attributes:
        encoder_model: Sentence transformer model for encoding
        k_per_index: Default number of results per index
        timeout_seconds: Timeout for parallel retrieval
        supabase_url: Supabase project URL
        supabase_key: Supabase service role key
    """
    encoder_model: str = "BAAI/bge-m3"
    k_per_index: int = 10
    timeout_seconds: float = 30.0
    supabase_url: str = ""
    supabase_key: str = ""
    
    @classmethod
    def from_env(cls) -> "RetrieverConfig":
        """Create config from environment variables."""
        return cls(
            encoder_model=os.getenv("ENCODER_MODEL", "BAAI/bge-m3"),
            k_per_index=int(os.getenv("K_PER_INDEX", "10")),
            timeout_seconds=float(os.getenv("RETRIEVAL_TIMEOUT", "30.0")),
            supabase_url=os.getenv("SUPABASE_URL", ""),
            supabase_key=os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""),
        )


@dataclass(frozen=True)
class FusionConfig:
    """
    Configuration for ResultFusion.
    
    Attributes:
        max_docs: Maximum documents to return after fusion
        source_weights: Weight multipliers per source
    """
    max_docs: int = 15
    
    # Source-based weights
    source_weights: Dict[str, float] = None
    
    def __post_init__(self):
        if self.source_weights is None:
            # Use object.__setattr__ for frozen dataclass
            object.__setattr__(self, 'source_weights', {
                "glossary": 0.8,   # Lower priority for definitions
                "legal": 1.1,      # Boost legal for compliance questions
                "financial": 1.0,  # Standard priority
                "news": 1.0        # Standard priority
            })
    
    def get_weight(self, source: str) -> float:
        """Get weight for a source."""
        if self.source_weights is None:
            return 1.0
        return self.source_weights.get(source, 1.0)


# Index to table mapping
INDEX_TABLE_MAP = {
    "glossary": "glossary_index",
    "legal": "legal_index",
    "financial": "finance_index",
    "news": "news_index"
}


def get_table_name(index: str) -> str:
    """Get Supabase table name for an index."""
    return INDEX_TABLE_MAP.get(index, f"{index}_index")
