"""
Finance index table schema from Supabase.
"""
from typing import Optional

from .base import SupabaseBaseModel


class FinanceIndex(SupabaseBaseModel):
    """Schema for finance_index table."""
    id: int
    chunk_uid: Optional[str]
    ticker: Optional[str]
    content: Optional[str]
    chunk_index: Optional[int]
    embedding: Optional[str]  # vector stored as string
    metadata: Optional[dict]  # JSON field
