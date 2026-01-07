"""
Portfolio and insights table schemas from Supabase.
"""
from typing import Optional

from .base import SupabaseBaseModel


class Portfolios(SupabaseBaseModel):
    """Schema for portfolios table."""
    portfolio_id: str  # UUID string
    user_id: Optional[str]  # UUID string
    ticker: Optional[str]
    volume: Optional[float]
    avg_buy_price: Optional[float]
    updated_at: str  # timestamp string


class DailyInsights(SupabaseBaseModel):
    """Schema for daily_insights table."""
    insight_id: str  # UUID string
    user_id: Optional[str]  # UUID string
    content: Optional[str]
    market_sentiment: Optional[str]
    related_news_ids: Optional[dict]  # JSON field
    created_at: str  # timestamp string
