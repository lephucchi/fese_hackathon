"""
User Repository - Data access layer for users table.

Handles all database operations for user management.
"""
import uuid
from typing import Optional, Dict, Any
from supabase import Client

from ..repositories.base import BaseRepository


class UserRepository(BaseRepository):
    """Repository for users table operations."""
    
    def __init__(self, supabase: Client):
        """
        Initialize user repository.
        
        Args:
            supabase: Supabase client instance
        """
        super().__init__(supabase, "users")
    
    async def find_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """
        Find user by email address.
        
        Args:
            email: Email address to search for
            
        Returns:
            User dict if found, None otherwise
        """
        response = self.supabase.table(self.table_name)\
            .select("*, roles(role_id, user_type)")\
            .eq("email", email)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def find_by_id(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Find user by user_id.
        
        Args:
            user_id: UUID string of user
            
        Returns:
            User dict with role info if found, None otherwise
        """
        response = self.supabase.table(self.table_name)\
            .select("*, roles(role_id, user_type)")\
            .eq("user_id", user_id)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def create(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new user.
        
        Args:
            user_data: User data including email, password_hash, etc.
            
        Returns:
            Created user dict
        """
        # Generate UUID for user_id if not provided
        if "user_id" not in user_data:
            user_data["user_id"] = str(uuid.uuid4())
        
        response = self.supabase.table(self.table_name)\
            .insert(user_data)\
            .execute()
        
        return response.data[0] if response.data else {}
    
    async def update(self, user_id: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update user fields.
        
        Args:
            user_id: UUID of user to update
            data: Fields to update
            
        Returns:
            Updated user dict or None
        """
        response = self.supabase.table(self.table_name)\
            .update(data)\
            .eq("user_id", user_id)\
            .execute()
        
        if response.data:
            return response.data[0]
        return None
    
    async def update_password(self, user_id: str, password_hash: str) -> bool:
        """
        Update user's password hash.
        
        Args:
            user_id: UUID of user
            password_hash: New hashed password
            
        Returns:
            True if updated successfully
        """
        response = self.supabase.table(self.table_name)\
            .update({"password_hash": password_hash})\
            .eq("user_id", user_id)\
            .execute()
        
        return len(response.data) > 0
    
    async def email_exists(self, email: str) -> bool:
        """
        Check if email already exists.
        
        Args:
            email: Email to check
            
        Returns:
            True if email is already registered
        """
        response = self.supabase.table(self.table_name)\
            .select("user_id")\
            .eq("email", email)\
            .execute()
        
        return len(response.data) > 0
    
    async def find_all(self, limit: int = 50, offset: int = 0) -> list:
        """
        Get all users with pagination.
        
        Args:
            limit: Maximum number of users to return
            offset: Number of users to skip
            
        Returns:
            List of user dicts
        """
        response = self.supabase.table(self.table_name)\
            .select("user_id, email, first_name, last_name, display_name, avatar_url, role_id, created_at")\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return response.data if response.data else []

