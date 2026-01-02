"""
Centralized Configuration for Multi-Index RAG System.

All configuration classes are imported here for easy access.
"""
import os
from dotenv import load_dotenv

# Load .env from project root
load_dotenv()


# Default constants
# from .defaults import DEFAULT_GEMINI_MODEL

# Re-export configs
from .router_config import RouterConfig, DEFAULT_CONFIG, FAST_CONFIG, ACCURATE_CONFIG
from .decomposition_config import DecomposerConfig, ClassifierConfig, QueryType
from .retrieval_config import RetrieverConfig, FusionConfig, INDEX_TABLE_MAP


class Settings:
    """Global application settings from environment."""
    
    # Supabase
    SUPABASE_URL: str = os.getenv("supabase_url", "")
    SUPABASE_KEY: str = os.getenv("supabase_service_role_key", "")
    
    # Gemini
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "")
    
    # Encoder
    ENCODER_MODEL: str = os.getenv("ENCODER_MODEL", "BAAI/bge-m3")
    
    # LangSmith (optional)
    LANGCHAIN_TRACING: bool = os.getenv("LANGCHAIN_TRACING_V2", "false").lower() == "true"
    LANGCHAIN_API_KEY: str = os.getenv("LANGCHAIN_API_KEY", "")
    
    @classmethod
    def validate(cls) -> bool:
        """Check if required settings are configured."""
        required = [cls.SUPABASE_URL, cls.SUPABASE_KEY, cls.GEMINI_API_KEY, cls.GEMINI_MODEL]
        return all(required)


settings = Settings()

__all__ = [
    "settings",
    "Settings",
    "RouterConfig",
    "DEFAULT_CONFIG",
    "FAST_CONFIG", 
    "ACCURATE_CONFIG",
    "DecomposerConfig",
    "ClassifierConfig",
    "QueryType",
    "RetrieverConfig",
    "FusionConfig",
    "INDEX_TABLE_MAP",
]
