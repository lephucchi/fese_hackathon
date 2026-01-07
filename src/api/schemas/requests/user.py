"""
User Request Schemas.

Pydantic models for user profile endpoint request bodies.
"""
from typing import Optional
from pydantic import BaseModel, Field, HttpUrl


class UpdateProfileRequest(BaseModel):
    """Request body for updating user profile."""
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
        description="Display name"
    )
    avatar_url: Optional[str] = Field(
        None,
        description="Custom avatar URL"
    )
    risk_appetite: Optional[str] = Field(
        None,
        description="Risk appetite setting (conservative, moderate, aggressive)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "first_name": "Nguyen",
                    "last_name": "Van B",
                    "display_name": "New Display Name",
                    "risk_appetite": "aggressive"
                }
            ]
        }
    }
