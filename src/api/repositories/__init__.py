"""
Repositories package.

Data access layer for Supabase operations.
"""
from .base import BaseRepository
from .vector_repo import VectorRepository

__all__ = [
    "BaseRepository",
    "VectorRepository",
]
