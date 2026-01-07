"""
Authentication Response Schemas.

Pydantic models for auth endpoint responses.
"""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class RoleInfo(BaseModel):
    """Role information."""
    role_id: int
    user_type: str


class UserInfo(BaseModel):
    """User information returned in responses."""
    user_id: str = Field(..., description="User's unique ID")
    email: str = Field(..., description="User's email")
    first_name: Optional[str] = Field(None, description="First name")
    last_name: Optional[str] = Field(None, description="Last name")
    display_name: Optional[str] = Field(None, description="Display name")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    risk_appetite: Optional[str] = Field(None, description="Risk appetite setting")
    role: Optional[RoleInfo] = Field(None, description="User's role")
    created_at: Optional[str] = Field(None, description="Account creation timestamp")


class AuthResponse(BaseModel):
    """Response for register and login endpoints."""
    message: str = Field(..., description="Response message")
    user: UserInfo = Field(..., description="User information")
    access_token: Optional[str] = Field(None, description="JWT access token")
    refresh_token: Optional[str] = Field(None, description="JWT refresh token (for mobile clients)")
    token_type: str = Field(default="bearer", description="Token type")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Login successful",
                    "user": {
                        "user_id": "uuid-string",
                        "email": "user@example.com",
                        "display_name": "Nguyen Van A",
                        "avatar_url": "https://ui-avatars.com/api/?name=Nguyen+Van+A",
                        "role": {
                            "role_id": 1,
                            "user_type": "Normal"
                        }
                    },
                    "access_token": "eyJhbGciOiJIUzI1NiIs...",
                    "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
                    "token_type": "bearer"
                }
            ]
        }
    }


class RefreshResponse(BaseModel):
    """Response for token refresh endpoint."""
    message: str = Field(default="Token refreshed", description="Response message")
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field(default="bearer", description="Token type")


class LogoutResponse(BaseModel):
    """Response for logout endpoint."""
    message: str = Field(default="Logout successful", description="Response message")


class SessionInfo(BaseModel):
    """Session information for multi-device management."""
    session_id: str = Field(..., description="Session ID")
    device_info: Optional[dict] = Field(None, description="Device information")
    created_at: str = Field(..., description="Session creation time")
    last_used_at: str = Field(..., description="Last activity time")
    is_current: bool = Field(default=False, description="Whether this is the current session")


class SessionsResponse(BaseModel):
    """Response for list sessions endpoint."""
    sessions: List[SessionInfo] = Field(..., description="List of active sessions")
    total: int = Field(..., description="Total number of sessions")
