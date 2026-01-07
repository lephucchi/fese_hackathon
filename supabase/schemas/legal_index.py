"""
Legal index table schema from Supabase.
"""
from typing import Optional

from .base import SupabaseBaseModel


class LegalIndex(SupabaseBaseModel):
    """Schema for legal_index table."""
    id: int
    chunk_uid: Optional[str]
    law_id: Optional[str]
    article_id: Optional[str]
    content: Optional[str]
    chunk_index: Optional[int]
    embedding: Optional[str]  # vector stored as string
    metadata: Optional[dict]  # JSON field
