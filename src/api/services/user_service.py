"""
User Service - Business logic for user profile management.

Handles profile retrieval and updates.
"""
import logging
from typing import Dict, Any, Optional

from ..repositories.user_repository import UserRepository
from ..utils.password import hash_password, verify_password
from ..exceptions import ValidationException, AuthenticationException, NotFoundException

logger = logging.getLogger(__name__)


class UserService:
    """Service for user profile operations."""
    
    def __init__(self, user_repository: UserRepository):
        """
        Initialize user service.
        
        Args:
            user_repository: UserRepository instance
        """
        self.user_repo = user_repository
    
    async def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        """
        Get user profile by ID.
        
        Args:
            user_id: User's UUID
            
        Returns:
            User profile dict
            
        Raises:
            NotFoundException: If user not found
        """
        user = await self.user_repo.find_by_id(user_id)
        
        if not user:
            raise NotFoundException(message="User not found")
        
        return self._format_user_response(user)
    
    async def update_profile(
        self,
        user_id: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
        risk_appetite: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Update user profile fields.
        
        Args:
            user_id: User's UUID
            first_name: Optional new first name
            last_name: Optional new last name
            display_name: Optional new display name
            avatar_url: Optional new avatar URL
            risk_appetite: Optional risk appetite setting
            
        Returns:
            Updated user profile
            
        Raises:
            NotFoundException: If user not found
        """
        # Build update data (only non-None values)
        update_data = {}
        if first_name is not None:
            update_data["first_name"] = first_name
        if last_name is not None:
            update_data["last_name"] = last_name
        if display_name is not None:
            update_data["display_name"] = display_name
        if avatar_url is not None:
            update_data["avatar_url"] = avatar_url
        if risk_appetite is not None:
            update_data["risk_appetite"] = risk_appetite
        
        if not update_data:
            # No changes, just return current user
            return await self.get_user_by_id(user_id)
        
        logger.info(f"Updating profile for user {user_id}: {list(update_data.keys())}")
        
        updated_user = await self.user_repo.update(user_id, update_data)
        
        if not updated_user:
            raise NotFoundException(message="User not found")
        
        # Fetch full user with role info
        return await self.get_user_by_id(user_id)
    
    async def change_password(
        self,
        user_id: str,
        current_password: str,
        new_password: str
    ) -> bool:
        """
        Change user's password.
        
        Args:
            user_id: User's UUID
            current_password: Current password for verification
            new_password: New password to set
            
        Returns:
            True if password changed successfully
            
        Raises:
            NotFoundException: If user not found
            AuthenticationException: If current password is wrong
        """
        # Get user with password hash
        user = await self.user_repo.find_by_id(user_id)
        
        if not user:
            raise NotFoundException(message="User not found")
        
        # Verify current password
        if not verify_password(current_password, user["password_hash"]):
            raise AuthenticationException(message="Current password is incorrect")
        
        # Hash and update new password
        new_password_hash = hash_password(new_password)
        success = await self.user_repo.update_password(user_id, new_password_hash)
        
        if success:
            logger.info(f"Password changed for user {user_id}")
        
        return success
    
    def _format_user_response(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """Format user data for API response."""
        role = None
        if "roles" in user and user["roles"]:
            role = {
                "role_id": user["roles"]["role_id"],
                "user_type": user["roles"]["user_type"]
            }
        elif "role_id" in user:
            role_names = {1: "Normal", 2: "Premium", 3: "Business", 4: "Admin"}
            role = {
                "role_id": user["role_id"],
                "user_type": role_names.get(user["role_id"], "Unknown")
            }
        
        return {
            "user_id": user["user_id"],
            "email": user["email"],
            "first_name": user.get("first_name"),
            "last_name": user.get("last_name"),
            "display_name": user.get("display_name"),
            "avatar_url": user.get("avatar_url"),
            "risk_appetite": user.get("risk_appetite"),
            "role": role,
            "created_at": user.get("created_at")
        }
