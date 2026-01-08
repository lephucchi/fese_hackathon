"""
Market data table schema from Supabase.
"""
from typing import Optional

from .base import SupabaseBaseModel


class MarketData(SupabaseBaseModel):
    """Schema for market_data table."""
    ticker: str
    company_name: Optional[str]
    exchange: Optional[str]
    industry: Optional[str]
    categories: Optional[str]

