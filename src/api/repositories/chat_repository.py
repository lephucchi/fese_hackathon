"""
Chat Repository - Data access layer for chat_history table.

Handles all database operations for chat history management.
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

from supabase import Client

logger = logging.getLogger(__name__)


class ChatRepository:
    """Repository for chat_history table operations."""
    
    TABLE_NAME = "chat_history"
    
    def __init__(self, supabase: Client):
        """
        Initialize chat repository.
        
        Args:
            supabase: Supabase client instance
        """
        self.supabase = supabase
    
    async def save_message(
        self,
        user_id: str,
        content: str,
        message_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Save a chat message to history.
        
        Args:
            user_id: UUID of user
            content: Message content (JSON string with query + response)
            message_id: Optional UUID, auto-generated if not provided
            
        Returns:
            Saved message record
        """
        try:
            if not message_id:
                message_id = str(uuid.uuid4())
            
            data = {
                "message_id": message_id,
                "user_id": user_id,
                "content": content,
                "created_at": datetime.utcnow().isoformat()
            }
            
            response = self.supabase.table(self.TABLE_NAME)\
                .insert(data)\
                .execute()
            
            if response.data:
                logger.debug(f"Saved message {message_id} for user {user_id}")
                return response.data[0]
            
            return data
            
        except Exception as e:
            logger.error(f"Error saving chat message: {e}")
            raise
    
    async def get_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Get chat history for a user.
        
        Args:
            user_id: UUID of user
            limit: Maximum messages to return
            offset: Number of messages to skip
            
        Returns:
            List of chat messages, newest first
        """
        try:
            response = self.supabase.table(self.TABLE_NAME)\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .range(offset, offset + limit - 1)\
                .execute()
            
            return response.data or []
            
        except Exception as e:
            logger.error(f"Error getting chat history: {e}")
            return []
    
    async def get_recent_messages(
        self,
        user_id: str,
        count: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Get most recent messages for context.
        
        Args:
            user_id: UUID of user
            count: Number of recent messages
            
        Returns:
            List of recent messages, oldest first (for context building)
        """
        try:
            response = self.supabase.table(self.TABLE_NAME)\
                .select("*")\
                .eq("user_id", user_id)\
                .order("created_at", desc=True)\
                .limit(count)\
                .execute()
            
            # Reverse to get chronological order
            messages = response.data or []
            return list(reversed(messages))
            
        except Exception as e:
            logger.error(f"Error getting recent messages: {e}")
            return []
    
    async def get_message_by_id(
        self,
        message_id: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a specific message by ID.
        
        Args:
            message_id: UUID of message
            
        Returns:
            Message record or None
        """
        try:
            response = self.supabase.table(self.TABLE_NAME)\
                .select("*")\
                .eq("message_id", message_id)\
                .single()\
                .execute()
            
            return response.data
            
        except Exception as e:
            logger.error(f"Error getting message {message_id}: {e}")
            return None
    
    async def delete_history(self, user_id: str) -> bool:
        """
        Delete all chat history for a user.
        
        Args:
            user_id: UUID of user
            
        Returns:
            True if deleted successfully
        """
        try:
            self.supabase.table(self.TABLE_NAME)\
                .delete()\
                .eq("user_id", user_id)\
                .execute()
            
            logger.info(f"Deleted chat history for user {user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error deleting chat history: {e}")
            return False
    
    async def count_messages(self, user_id: str) -> int:
        """
        Count total messages for a user.
        
        Args:
            user_id: UUID of user
            
        Returns:
            Total message count
        """
        try:
            response = self.supabase.table(self.TABLE_NAME)\
                .select("message_id", count="exact")\
                .eq("user_id", user_id)\
                .execute()
            
            return response.count or 0
            
        except Exception as e:
            logger.error(f"Error counting messages: {e}")
            return 0
