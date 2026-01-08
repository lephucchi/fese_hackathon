"""
Repositories package.

Data access layer for Supabase operations.
"""
from .base import BaseRepository
from .vector_repo import VectorRepository
from .user_repository import UserRepository
from .news_repository import NewsRepository
from .user_interaction_repository import UserInteractionRepository

__all__ = [
    "BaseRepository",
    "VectorRepository",
    "UserRepository",
    "NewsRepository",
    "UserInteractionRepository",
]
