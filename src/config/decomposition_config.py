"""
Configuration module for Query Decomposition.

Centralizes all configuration for the decomposition module,
following the Single Responsibility Principle.
"""
import os
from dataclasses import dataclass, field
from typing import Optional, Dict, List
from dotenv import load_dotenv

# from .defaults import DEFAULT_GEMINI_MODEL

load_dotenv()


def _get_gemini_model() -> str:
    """Get Gemini model from environment, raise if not set."""
    model = os.getenv("GEMINI_MODEL", "")
    if not model:
        raise ValueError("GEMINI_MODEL environment variable is not set")
    return model


@dataclass(frozen=True)
class DecomposerConfig:
    """
    Immutable configuration for QueryDecomposer.
    
    Attributes:
        model_name: Gemini model to use
        max_sub_queries: Maximum number of sub-queries to return
        temperature: LLM temperature (lower = more deterministic)
        max_tokens: Maximum output tokens
        timeout_seconds: Timeout for LLM calls
    """
    model_name: str = field(default_factory=_get_gemini_model)
    max_sub_queries: int = 5
    temperature: float = 0.1
    max_tokens: int = 1024
    timeout_seconds: float = 30.0
    
    @classmethod
    def from_env(cls) -> "DecomposerConfig":
        """Create config from environment variables."""
        return cls(
            model_name=_get_gemini_model(),
            max_sub_queries=int(os.getenv("MAX_SUB_QUERIES", "5")),
            temperature=float(os.getenv("LLM_TEMPERATURE", "0.1")),
        )


@dataclass(frozen=True)
class ClassifierConfig:
    """
    Configuration for QueryComplexityClassifier.
    
    Attributes:
        min_words_for_complex: Minimum word count for complex classification
        min_clauses_for_complex: Minimum clause count for complex
        composite_patterns: Patterns indicating composite queries
        multi_intent_patterns: Patterns indicating multi-intent queries
    """
    min_words_for_complex: int = 10
    min_clauses_for_complex: int = 2
    
    # Vietnamese composite patterns
    composite_patterns: tuple = (
        r"\bvà\b",           # "X và Y"
        r"\bvới\b",          # "X với Y"
        r"\bcũng như\b",     # "X cũng như Y"
        r"\bngoài ra\b",     # "ngoài ra"
        r"\bđồng thời\b",    # "đồng thời"
        r"\bso sánh\b.*\bvà\b",  # "so sánh X và Y"
        r"\blà gì.*\bvà\b",  # "X là gì và ..."
        r"\bcòn\b.*\bthì\b", # "X còn Y thì"
    )
    
    multi_intent_patterns: tuple = (
        r"(là gì|là sao).*(bao nhiêu|như thế nào)",
        r"(quy định|luật).*(chỉ số|dữ liệu|bao nhiêu)",
        r"(tin tức|mới nhất).*(là gì|định nghĩa)",
        r"(so sánh|đối chiếu).*(giải thích|là gì)",
    )


# Query type enumeration
class QueryType:
    """Query type constants."""
    GLOSSARY = "GLOSSARY"
    LEGAL = "LEGAL"
    FINANCIAL = "FINANCIAL"
    NEWS = "NEWS"
    UNKNOWN = "UNKNOWN"
    
    @classmethod
    def all(cls) -> List[str]:
        return [cls.GLOSSARY, cls.LEGAL, cls.FINANCIAL, cls.NEWS]
    
    @classmethod
    def is_valid(cls, query_type: str) -> bool:
        return query_type in cls.all() or query_type == cls.UNKNOWN
