"""
Glossary index table schema from Supabase.
"""
from typing import Optional, List

from .base import SupabaseBaseModel


class GlossaryIndex(SupabaseBaseModel):
    """Schema for glossary_index table."""
    id: int
    term: str
    definition: Optional[str]
    detailed_explanation: Optional[str]
    category: Optional[str]
    aliases: Optional[List[str]]  # string[] in TypeScript
    embedding: Optional[str]  # vector stored as string
    source_url: Optional[str]
    source_date: Optional[str]  # timestamp string
    metadata: Optional[dict]  # JSON field
    created_at: Optional[str]  # timestamp string
    updated_at: Optional[str]  # timestamp string
