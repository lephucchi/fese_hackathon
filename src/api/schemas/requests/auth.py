"""
Authentication Request Schemas.

Pydantic models for auth endpoint request bodies.
"""
import re
from typing import Optional
from pydantic import BaseModel, Field, field_validator, EmailStr


class RegisterRequest(BaseModel):
    """Request body for user registration."""
    email: EmailStr = Field(
        ...,
        description="User's email address"
    )
    password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="Password (min 8 chars, must contain uppercase, lowercase, and number)"
    )
    first_name: Optional[str] = Field(
        None,
        max_length=50,
        description="User's first name"
    )
    last_name: Optional[str] = Field(
        None,
        max_length=50,
        description="User's last name"
    )
    display_name: Optional[str] = Field(
        None,
        max_length=100,
        description="Display name for the user"
    )
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password strength."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "password": "SecurePass123",
                    "first_name": "Nguyen",
                    "last_name": "Van A",
                    "display_name": "Nguyen Van A"
                }
            ]
        }
    }


class LoginRequest(BaseModel):
    """Request body for user login."""
    email: EmailStr = Field(
        ...,
        description="User's email address"
    )
    password: str = Field(
        ...,
        description="User's password"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "email": "user@example.com",
                    "password": "SecurePass123"
                }
            ]
        }
    }


class ChangePasswordRequest(BaseModel):
    """Request body for changing password."""
    current_password: str = Field(
        ...,
        description="Current password"
    )
    new_password: str = Field(
        ...,
        min_length=8,
        max_length=100,
        description="New password"
    )
    confirm_password: str = Field(
        ...,
        description="Confirm new password"
    )
    
    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, v: str) -> str:
        """Validate new password strength."""
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one number")
        return v
    
    @field_validator("confirm_password")
    @classmethod
    def validate_passwords_match(cls, v: str, info) -> str:
        """Validate that passwords match."""
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("Passwords do not match")
        return v
