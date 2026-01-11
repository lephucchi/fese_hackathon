"""
User Interaction Repository - Data access layer for user_interactions table.

Handles all database operations for user interactions with news.
"""
import uuid
from typing import Optional, List, Dict, Any
from supabase import Client

from .base import BaseRepository


class UserInteractionRepository(BaseRepository):
    """Repository for user_interactions table operations."""
    
    def __init__(self, supabase: Client):
        """
        Initialize user interaction repository.
        
        Args:
            supabase: Supabase client instance
        """
        super().__init__(supabase, "user_interactions")
    
    async def create(self, user_id: str, news_id: str, action_type: str) -> Dict[str, Any]:
        """
        Create a new interaction record.
        
        Args:
            user_id: UUID of user
            news_id: UUID of news article
            action_type: Type of action (approve/reject)
            
        Returns:
            Created interaction dict
        """
        interaction_data = {
            "interaction_id": str(uuid.uuid4()),
            "user_id": user_id,
            "news_id": news_id,
            "action_type": action_type
        }
        
        response = self.supabase.table(self.table_name)\
            .insert(interaction_data)\
            .execute()
        
        return response.data[0] if response.data else {}
    
    async def find_by_user(
        self,
        user_id: str,
        action_type: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Find interactions by user ID.
        
        Args:
            user_id: UUID of user
            action_type: Optional filter by action type
            limit: Max results
            offset: Skip count
            
        Returns:
            List of interaction dicts
        """
        query = self.supabase.table(self.table_name)\
            .select("*")\
            .eq("user_id", user_id)
        
        if action_type:
            query = query.eq("action_type", action_type)
        
        query = query.order("created_at", desc=True)\
            .range(offset, offset + limit - 1)
        
        response = query.execute()
        return response.data if response.data else []
    
    async def find_approved_news_ids(self, user_id: str) -> List[str]:
        """
        Get list of news_ids that user has swiped right (approved).
        
        Args:
            user_id: UUID of user
            
        Returns:
            List of unique approved news_ids
        """
        response = self.supabase.table(self.table_name)\
            .select("news_id")\
            .eq("user_id", user_id)\
            .eq("action_type", "SWIPE_RIGHT")\
            .execute()
        
        if response.data:
            # Use set to deduplicate news_ids
            unique_ids = list(set(item["news_id"] for item in response.data))
            return unique_ids
        return []
    
    async def exists(self, user_id: str, news_id: str) -> bool:
        """
        Check if interaction already exists.
        
        Args:
            user_id: UUID of user
            news_id: UUID of news
            
        Returns:
            True if exists
        """
        response = self.supabase.table(self.table_name)\
            .select("interaction_id")\
            .eq("user_id", user_id)\
            .eq("news_id", news_id)\
            .execute()
        
        return len(response.data) > 0 if response.data else False
    
    async def update_action(
        self,
        user_id: str,
        news_id: str,
        action_type: str
    ) -> Optional[Dict[str, Any]]:
        """
        Update existing interaction action type.
        
        Args:
            user_id: UUID of user
            news_id: UUID of news
            action_type: New action type
            
        Returns:
            Updated interaction or None
        """
        response = self.supabase.table(self.table_name)\
            .update({"action_type": action_type})\
            .eq("user_id", user_id)\
            .eq("news_id", news_id)\
            .execute()
        
        return response.data[0] if response.data else None
    
    async def count_by_user(self, user_id: str, action_type: Optional[str] = None) -> int:
        """
        Count interactions for a user.
        
        Args:
            user_id: UUID of user
            action_type: Optional filter
            
        Returns:
            Count of interactions
        """
        query = self.supabase.table(self.table_name)\
            .select("interaction_id", count="exact")\
            .eq("user_id", user_id)
        
        if action_type:
            query = query.eq("action_type", action_type)
        
        response = query.execute()
        return response.count if hasattr(response, 'count') and response.count else len(response.data)
    
    async def delete_by_user_and_news(self, user_id: str, news_id: str) -> bool:
        """
        Delete interaction for a specific user and news.
        
        Args:
            user_id: UUID of user
            news_id: UUID of news article
            
        Returns:
            True if deleted, False if not found
        """
        response = self.supabase.table(self.table_name)\
            .delete()\
            .eq("user_id", user_id)\
            .eq("news_id", news_id)\
            .execute()
        
        return len(response.data) > 0 if response.data else False

