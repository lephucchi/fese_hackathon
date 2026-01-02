"""
Pydantic Response Schemas for RAG API.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Citation reference."""
    number: int = Field(..., description="Citation number [1], [2], etc.")
    source: str = Field(..., description="Source index (glossary, legal, financial, news)")
    preview: str = Field(..., description="Preview of cited content")
    similarity: Optional[float] = Field(default=None, description="Similarity score")


class ResponseMetadata(BaseModel):
    """Metadata about the query processing."""
    routes: List[str] = Field(..., description="Selected indices")
    is_complex: bool = Field(..., description="Whether query was decomposed")
    sub_queries: List[str] = Field(default=[], description="Decomposed sub-queries")
    total_time_ms: float = Field(..., description="Total processing time in ms")
    step_times: Dict[str, float] = Field(default={}, description="Time per step")


class QueryResponse(BaseModel):
    """Response body for /api/query endpoint."""
    answer: str = Field(..., description="Generated answer with citations")
    is_grounded: bool = Field(..., description="Whether answer is grounded in sources")
    citations: List[Citation] = Field(default=[], description="Citation references")
    metadata: ResponseMetadata = Field(..., description="Processing metadata")
    
    # Optional fields based on request options
    sources: Optional[List[Dict[str, Any]]] = Field(default=None, description="Source documents")
    context: Optional[str] = Field(default=None, description="Raw context string")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "answer": "ROE là tỷ suất sinh lời trên vốn chủ sở hữu [1]. VNM có ROE 25% [2].",
                    "is_grounded": True,
                    "citations": [
                        {"number": 1, "source": "glossary", "preview": "ROE là..."},
                        {"number": 2, "source": "financial", "preview": "VNM báo cáo..."}
                    ],
                    "metadata": {
                        "routes": ["glossary", "financial"],
                        "is_complex": True,
                        "sub_queries": ["ROE là gì?", "VNM có ROE bao nhiêu?"],
                        "total_time_ms": 2500,
                        "step_times": {"route": 50, "decompose": 300, "retrieve": 800, "generate": 1350}
                    }
                }
            ]
        }
    }


class HealthResponse(BaseModel):
    """Response for /api/health endpoint."""
    status: str = Field(..., description="Overall status: healthy, degraded, unhealthy")
    components: Dict[str, str] = Field(..., description="Status of each component")
    version: str = Field(default="1.0.0", description="API version")


class ErrorResponse(BaseModel):
    """Error response schema."""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(default=None, description="Additional details")
