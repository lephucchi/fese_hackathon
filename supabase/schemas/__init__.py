"""
Supabase schema models package.

This package contains Pydantic models representing the exact structure
of tables in the Supabase database. These models are auto-generated
from database.types.ts and serve as the single source of truth for
data structure validation in FastAPI and other Python components.

All models inherit from SupabaseBaseModel and are configured to work
seamlessly with FastAPI's automatic validation and OpenAPI generation.
"""

from .base import SupabaseBaseModel
from .finance_index import FinanceIndex
from .functions import (
    MatchDocumentsResult,
    MatchFinanceDocumentsResult,
    MatchGlossaryResult,
    MatchLegalDocumentsResult,
    MatchNewsDocumentsResult,
)
from .glossary_index import GlossaryIndex
from .legal_index import LegalIndex
from .market import MarketData
from .news import News, NewsStockMapping
from .news_index import NewsIndex
from .portfolio import DailyInsights, Portfolios
from .users import ChatHistory, Roles, UserInteractions, Users

__all__ = [
    # Base
    "SupabaseBaseModel",
    # User-related
    "Roles",
    "Users",
    "ChatHistory",
    "UserInteractions",
    # Portfolio and insights
    "Portfolios",
    "DailyInsights",
    # Market data
    "MarketData",
    # News
    "News",
    "NewsStockMapping",
    # Indices
    "FinanceIndex",
    "NewsIndex",
    "LegalIndex",
    "GlossaryIndex",
    # Function return types
    "MatchDocumentsResult",
    "MatchFinanceDocumentsResult",
    "MatchGlossaryResult",
    "MatchLegalDocumentsResult",
    "MatchNewsDocumentsResult",
]
