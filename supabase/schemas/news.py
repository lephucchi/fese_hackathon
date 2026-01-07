"""
News-related table schemas from Supabase.
"""
from typing import Optional, Dict, Any

from .base import SupabaseBaseModel


class News(SupabaseBaseModel):
    """Schema for news table."""
    news_id: str  # UUID string
    title: str
    content: Optional[str] = None
    source_url: Optional[str] = None
    published_at: Optional[str] = None  # timestamp string
    sentiment: Optional[str] = None
    analyst: Optional[Dict[str, Any]] = None  # JSON object for analysis data


class NewsStockMapping(SupabaseBaseModel):
    """Schema for news_stock_mapping table."""
    news_id: str  # UUID string
    ticker: str
