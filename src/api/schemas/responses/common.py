"""
Common response schemas.
"""
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    """Response for /api/health endpoint."""
    status: str = Field(..., description="Overall status")
    components: Dict[str, str] = Field(..., description="Component statuses")
    version: str = Field(default="1.0.0", description="API version")


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional details")
