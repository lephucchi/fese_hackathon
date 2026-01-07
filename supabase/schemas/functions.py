"""
Return type schemas for Supabase database functions (RPC/stored procedures).

These models represent the structure of data returned by various
match_* functions used for vector similarity search across different indices.
"""
from typing import Optional

from .base import SupabaseBaseModel


class MatchDocumentsResult(SupabaseBaseModel):
    """Return type for match_documents function."""
    id: int
    content: str
    metadata: dict
    similarity: float


class MatchFinanceDocumentsResult(SupabaseBaseModel):
    """Return type for match_finance_documents function."""
    id: int
    chunk_uid: str
    ticker: str
    content: str
    metadata: dict
    similarity: float


class MatchGlossaryResult(SupabaseBaseModel):
    """Return type for match_glossary function."""
    id: int
    term: str
    definition: str
    detailed_explanation: str
    similarity: float


class MatchLegalDocumentsResult(SupabaseBaseModel):
    """Return type for match_legal_documents function."""
    id: int
    chunk_uid: str
    law_id: str
    article_id: str
    content: str
    metadata: dict
    similarity: float


class MatchNewsDocumentsResult(SupabaseBaseModel):
    """Return type for match_news_documents function."""
    id: int
    chunk_uid: str
    title: str
    content: str
    metadata: dict
    similarity: float
