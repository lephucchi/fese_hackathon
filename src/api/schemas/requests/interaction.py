"""
Interaction Request Schemas.

Pydantic models for user interaction endpoint request bodies.
"""
from typing import Literal
from pydantic import BaseModel, Field


class CreateInteractionRequest(BaseModel):
    """Request body for creating user interaction (swipe)."""
    news_id: str = Field(
        ...,
        description="UUID of the news article"
    )
    action_type: Literal["approve", "reject"] = Field(
        ...,
        description="Type of interaction: 'approve' (swipe right) or 'reject' (swipe left)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "news_id": "550e8400-e29b-41d4-a716-446655440000",
                    "action_type": "approve"
                }
            ]
        }
    }
