"""
Authentication Service - Business logic for user authentication.

Handles registration, login, logout, and token management.
"""
import logging
from typing import Dict, Any, Optional

from ..repositories.user_repository import UserRepository
from ..utils.password import hash_password, verify_password
from ..utils.jwt import create_access_token, create_refresh_token
from ..utils.avatar import generate_avatar_url
from ..exceptions import ValidationException, AuthenticationException, NotFoundException

logger = logging.getLogger(__name__)

# Default role ID for new users (Normal)
DEFAULT_ROLE_ID = 1


class AuthService:
    """Service for authentication operations."""
    
    def __init__(self, user_repository: UserRepository):
        """
        Initialize auth service.
        
        Args:
            user_repository: UserRepository instance for database access
        """
        self.user_repo = user_repository
    
    async def register(
        self,
        email: str,
        password: str,
        first_name: Optional[str] = None,
        last_name: Optional[str] = None,
        display_name: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Register a new user.
        
        Args:
            email: User's email address
            password: Plain text password
            first_name: Optional first name
            last_name: Optional last name
            display_name: Optional display name
            
        Returns:
            Dict with user info and tokens
            
        Raises:
            ValidationException: If email already exists
        """
        logger.info(f"Registering new user: {email}")
        
        # Check if email already exists
        if await self.user_repo.email_exists(email):
            logger.warning(f"Registration failed: Email already exists - {email}")
            raise ValidationException(
                message="Email already registered",
                details={"email": email}
            )
        
        # Hash password
        password_hash = hash_password(password)
        
        # Generate avatar URL
        avatar_url = generate_avatar_url(
            email=email,
            display_name=display_name,
            first_name=first_name,
            last_name=last_name
        )
        
        # Create user
        user_data = {
            "email": email,
            "password_hash": password_hash,
            "first_name": first_name,
            "last_name": last_name,
            "display_name": display_name or self._generate_display_name(email, first_name, last_name),
            "avatar_url": avatar_url,
            "role_id": DEFAULT_ROLE_ID
        }
        
        created_user = await self.user_repo.create(user_data)
        
        if not created_user:
            raise ValidationException(message="Failed to create user")
        
        logger.info(f"User created successfully: {created_user['user_id']}")
        
        # Generate tokens
        token_data = {
            "sub": created_user["user_id"],
            "email": email,
            "role_id": DEFAULT_ROLE_ID
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return {
            "user": self._format_user_response(created_user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    
    async def login(self, email: str, password: str) -> Dict[str, Any]:
        """
        Authenticate user and generate tokens.
        
        Args:
            email: User's email
            password: Plain text password
            
        Returns:
            Dict with user info and tokens
            
        Raises:
            AuthenticationException: If credentials are invalid
        """
        logger.info(f"Login attempt: {email}")
        
        # Find user by email
        user = await self.user_repo.find_by_email(email)
        
        if not user:
            logger.warning(f"Login failed: User not found - {email}")
            raise AuthenticationException(
                message="Invalid email or password"
            )
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            logger.warning(f"Login failed: Invalid password - {email}")
            raise AuthenticationException(
                message="Invalid email or password"
            )
        
        logger.info(f"Login successful: {user['user_id']}")
        
        # Generate tokens
        token_data = {
            "sub": user["user_id"],
            "email": user["email"],
            "role_id": user.get("role_id", DEFAULT_ROLE_ID)
        }
        access_token = create_access_token(token_data)
        refresh_token = create_refresh_token(token_data)
        
        return {
            "user": self._format_user_response(user),
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    
    def _format_user_response(self, user: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format user data for API response.
        
        Args:
            user: Raw user data from database
            
        Returns:
            Formatted user dict
        """
        # Handle role info
        role = None
        if "roles" in user and user["roles"]:
            role = {
                "role_id": user["roles"]["role_id"],
                "user_type": user["roles"]["user_type"]
            }
        elif "role_id" in user:
            role = {
                "role_id": user["role_id"],
                "user_type": "Normal" if user["role_id"] == 1 else "Unknown"
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
    
    def _generate_display_name(
        self,
        email: str,
        first_name: Optional[str],
        last_name: Optional[str]
    ) -> str:
        """
        Generate a display name for user.
        
        Args:
            email: User's email
            first_name: Optional first name
            last_name: Optional last name
            
        Returns:
            Generated display name
        """
        if first_name and last_name:
            return f"{first_name} {last_name}"
        elif first_name:
            return first_name
        else:
            return email.split("@")[0]
