"""
Admin Routes - API endpoints for admin operations.

Only accessible by users with role_id = 4 (Admin).
"""
import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional

from ..services.user_service import UserService
from ..repositories.user_repository import UserRepository
from ..dependencies import get_supabase_client
from ..middleware.auth import get_current_user_payload, require_admin

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Admin"], prefix="/admin")


class UpdateUserRoleRequest(BaseModel):
    """Request body for updating user role."""
    role_id: int = Field(
        ...,
        ge=1,
        le=4,
        description="New role ID (1=Normal, 2=Premium, 3=Business, 4=Admin)"
    )


class UserRoleResponse(BaseModel):
    """Response for role update."""
    message: str
    user_id: str
    new_role_id: int
    new_role_name: str


def get_user_service() -> UserService:
    """Dependency to get UserService instance."""
    supabase = get_supabase_client()
    user_repo = UserRepository(supabase)
    return UserService(user_repo)


ROLE_NAMES = {1: "Normal", 2: "Premium", 3: "Business", 4: "Admin"}


@router.put(
    "/users/{user_id}/role",
    response_model=UserRoleResponse,
    summary="Update user role (Admin only)",
    description="""
    Update a user's role. Only accessible by administrators (role_id = 4).
    
    Available roles:
    - 1: Normal
    - 2: Premium
    - 3: Business
    - 4: Admin
    
    **Requires Admin authentication.**
    """
)
async def update_user_role(
    user_id: str,
    request: UpdateUserRoleRequest,
    admin_payload: dict = Depends(require_admin),
    user_service: UserService = Depends(get_user_service)
):
    """Update a user's role (Admin only)."""
    admin_user_id = admin_payload.get("sub")
    logger.info(f"Admin {admin_user_id} updating role for user {user_id} to {request.role_id}")
    
    # Get the user repository directly for role update
    supabase = get_supabase_client()
    user_repo = UserRepository(supabase)
    
    # Check if target user exists
    target_user = await user_repo.find_by_id(user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent admin from demoting themselves
    if user_id == admin_user_id and request.role_id != 4:
        raise HTTPException(
            status_code=400,
            detail="Admin cannot demote themselves"
        )
    
    # Update role
    updated = await user_repo.update(user_id, {"role_id": request.role_id})
    
    if not updated:
        raise HTTPException(status_code=500, detail="Failed to update role")
    
    role_name = ROLE_NAMES.get(request.role_id, "Unknown")
    
    logger.info(f"User {user_id} role updated to {role_name} by admin {admin_user_id}")
    
    return UserRoleResponse(
        message=f"User role updated to {role_name}",
        user_id=user_id,
        new_role_id=request.role_id,
        new_role_name=role_name
    )


@router.get(
    "/users",
    summary="List all users (Admin only)",
    description="Get a list of all users. Only accessible by administrators."
)
async def list_users(
    limit: int = 50,
    offset: int = 0,
    admin_payload: dict = Depends(require_admin)
):
    """List all users (Admin only)."""
    supabase = get_supabase_client()
    user_repo = UserRepository(supabase)
    
    users = await user_repo.find_all(limit=limit, offset=offset)
    
    # Format users for response (hide password hash)
    formatted_users = []
    for user in users:
        formatted_users.append({
            "user_id": user["user_id"],
            "email": user["email"],
            "display_name": user.get("display_name"),
            "role_id": user.get("role_id"),
            "created_at": user.get("created_at")
        })
    
    return {
        "users": formatted_users,
        "total": len(formatted_users),
        "limit": limit,
        "offset": offset
    }
