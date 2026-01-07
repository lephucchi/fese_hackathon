"""
News index table schema from Supabase.
"""
from typing import Optional

from .base import SupabaseBaseModel


class NewsIndex(SupabaseBaseModel):
    """Schema for news_index table."""
    id: int
    chunk_uid: Optional[str]
    article_id: Optional[str]
    title: Optional[str]
    content: Optional[str]
    chunk_index: Optional[int]
    embedding: Optional[str]  # vector stored as string
    metadata: Optional[dict]  # JSON field
