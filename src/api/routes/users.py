"""
User Routes - API endpoints for user profile management.

Handles profile retrieval and updates.
"""
import logging
from fastapi import APIRouter, Depends

from ..schemas.requests import UpdateProfileRequest, ChangePasswordRequest
from ..schemas.responses import UserInfo, RoleInfo
from ..services.user_service import UserService
from ..repositories.user_repository import UserRepository
from ..dependencies import get_supabase_client
from ..middleware.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Users"], prefix="/users")


def get_user_service() -> UserService:
    """Dependency to get UserService instance."""
    supabase = get_supabase_client()
    user_repo = UserRepository(supabase)
    return UserService(user_repo)


@router.get(
    "/me",
    response_model=UserInfo,
    summary="Get current user profile",
    description="Get the profile of the currently authenticated user."
)
async def get_current_user(
    user_id: str = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service)
):
    """Get current authenticated user's profile."""
    logger.info(f"Get profile request for user: {user_id}")
    
    user_data = await user_service.get_user_by_id(user_id)
    
    role_info = None
    if user_data.get("role"):
        role_info = RoleInfo(**user_data["role"])
    
    return UserInfo(
        user_id=user_data["user_id"],
        email=user_data["email"],
        first_name=user_data.get("first_name"),
        last_name=user_data.get("last_name"),
        display_name=user_data.get("display_name"),
        avatar_url=user_data.get("avatar_url"),
        risk_appetite=user_data.get("risk_appetite"),
        role=role_info,
        created_at=user_data.get("created_at")
    )


@router.put(
    "/me",
    response_model=dict,
    summary="Update current user profile",
    description="""
    Update the profile of the currently authenticated user.
    
    Only provided fields will be updated. Password cannot be changed here,
    use the /me/password endpoint instead.
    """
)
async def update_current_user(
    request: UpdateProfileRequest,
    user_id: str = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service)
):
    """Update current authenticated user's profile."""
    logger.info(f"Update profile request for user: {user_id}")
    
    user_data = await user_service.update_profile(
        user_id=user_id,
        first_name=request.first_name,
        last_name=request.last_name,
        display_name=request.display_name,
        avatar_url=request.avatar_url,
        risk_appetite=request.risk_appetite
    )
    
    role_info = None
    if user_data.get("role"):
        role_info = RoleInfo(**user_data["role"])
    
    return {
        "message": "Profile updated successfully",
        "user": UserInfo(
            user_id=user_data["user_id"],
            email=user_data["email"],
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            display_name=user_data.get("display_name"),
            avatar_url=user_data.get("avatar_url"),
            risk_appetite=user_data.get("risk_appetite"),
            role=role_info,
            created_at=user_data.get("created_at")
        )
    }


@router.put(
    "/me/password",
    response_model=dict,
    summary="Change password",
    description="""
    Change the password of the currently authenticated user.
    
    Requires current password for verification.
    New password must meet strength requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    """
)
async def change_password(
    request: ChangePasswordRequest,
    user_id: str = Depends(get_current_user_id),
    user_service: UserService = Depends(get_user_service)
):
    """Change current user's password."""
    logger.info(f"Password change request for user: {user_id}")
    
    await user_service.change_password(
        user_id=user_id,
        current_password=request.current_password,
        new_password=request.new_password
    )
    
    return {"message": "Password changed successfully"}
