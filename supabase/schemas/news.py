"""
News-related table schemas from Supabase.
"""
from typing import Optional

from .base import SupabaseBaseModel


class News(SupabaseBaseModel):
    """Schema for news table."""
    news_id: str  # UUID string
    title: str
    content: Optional[str]
    source_url: Optional[str]
    published_at: Optional[str]  # timestamp string
    sentiment: Optional[str]


class NewsStockMapping(SupabaseBaseModel):
    """Schema for news_stock_mapping table."""
    news_id: str  # UUID string
    ticker: str
