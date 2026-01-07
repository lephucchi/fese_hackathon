"""
Authentication Middleware - JWT verification and user extraction.

Provides middleware and dependencies for protecting routes.
"""
import logging
from typing import Optional
from fastapi import Request, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from ..utils.jwt import verify_access_token
from ..exceptions import AuthenticationException

logger = logging.getLogger(__name__)

# Optional bearer token security (for Swagger UI)
security = HTTPBearer(auto_error=False)


def get_token_from_request(request: Request) -> Optional[str]:
    """
    Extract JWT token from request.
    
    Checks in order:
    1. Cookie (access_token)
    2. Authorization header (Bearer token)
    
    Args:
        request: FastAPI Request object
        
    Returns:
        Token string if found, None otherwise
    """
    # Try cookie first
    token = request.cookies.get("access_token")
    if token:
        return token
    
    # Try Authorization header
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.split(" ")[1]
    
    return None


async def get_current_user_id(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> str:
    """
    Dependency to get current authenticated user ID.
    
    Args:
        request: FastAPI Request
        credentials: Optional bearer credentials from header
        
    Returns:
        User ID string
        
    Raises:
        AuthenticationException: If not authenticated or token invalid
    """
    token = get_token_from_request(request)
    
    if not token:
        raise AuthenticationException(message="Authentication required")
    
    payload = verify_access_token(token)
    if not payload:
        raise AuthenticationException(message="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException(message="Invalid token payload")
    
    return user_id


async def get_current_user_payload(
    request: Request,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)
) -> dict:
    """
    Dependency to get current authenticated user's full token payload.
    
    Returns:
        Token payload dict with user_id, email, role_id
    """
    token = get_token_from_request(request)
    
    if not token:
        raise AuthenticationException(message="Authentication required")
    
    payload = verify_access_token(token)
    if not payload:
        raise AuthenticationException(message="Invalid or expired token")
    
    return payload


def require_role(allowed_roles: list):
    """
    Dependency factory to require specific roles.
    
    Args:
        allowed_roles: List of allowed role_ids (1=Normal, 2=Premium, 3=Business, 4=Admin)
        
    Returns:
        Dependency function
    """
    async def role_checker(
        payload: dict = Depends(get_current_user_payload)
    ) -> dict:
        role_id = payload.get("role_id", 1)
        if role_id not in allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions"
            )
        return payload
    
    return role_checker


# Pre-defined role dependencies
require_admin = require_role([4])
require_business_or_above = require_role([3, 4])
require_premium_or_above = require_role([2, 3, 4])
