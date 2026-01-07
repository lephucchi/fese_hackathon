"""
User-related table schemas from Supabase.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID

from .base import SupabaseBaseModel


class Roles(SupabaseBaseModel):
    """Schema for roles table."""
    role_id: int
    user_type: str


class Users(SupabaseBaseModel):
    """Schema for users table."""
    user_id: str  # UUID string
    email: str
    password_hash: str
    first_name: Optional[str]
    last_name: Optional[str]
    display_name: Optional[str]
    avatar_url: Optional[str]
    risk_appetite: Optional[str]
    role_id: Optional[int]
    created_at: str  # timestamp string


class ChatHistory(SupabaseBaseModel):
    """Schema for chat_history table."""
    message_id: str  # UUID string
    user_id: Optional[str]  # UUID string
    content: Optional[str]
    created_at: str  # timestamp string


class UserInteractions(SupabaseBaseModel):
    """Schema for user_interactions table."""
    interaction_id: str  # UUID string
    user_id: Optional[str]  # UUID string
    news_id: Optional[str]  # UUID string
    action_type: Optional[str]
    created_at: str  # timestamp string
