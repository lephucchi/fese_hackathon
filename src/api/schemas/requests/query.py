"""
Request schemas for query endpoints.
"""
from typing import Optional
from pydantic import BaseModel, Field


class QueryOptions(BaseModel):
    """Optional query parameters."""
    max_docs: int = Field(
        default=10,
        ge=1,
        le=50,
        description="Maximum documents to retrieve"
    )
    include_sources: bool = Field(
        default=True,
        description="Include source documents in response"
    )
    include_context: bool = Field(
        default=False,
        description="Include raw context string"
    )
    language: str = Field(
        default="vi",
        description="Response language"
    )


class QueryRequest(BaseModel):
    """Request body for /api/query endpoint."""
    query: str = Field(
        ...,
        min_length=1,
        max_length=2000,
        description="User question"
    )
    options: Optional[QueryOptions] = Field(
        default=None,
        description="Optional settings"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "query": "ROE là gì và VNM có ROE bao nhiêu?",
                    "options": {
                        "max_docs": 10,
                        "include_sources": True
                    }
                }
            ]
        }
    }
