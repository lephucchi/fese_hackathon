"""
Response schemas for query endpoints.
"""
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class Citation(BaseModel):
    """Citation reference."""
    number: int = Field(..., description="Citation number [1], [2], etc.")
    source: str = Field(..., description="Source index")
    preview: str = Field(..., description="Preview of cited content")
    similarity: Optional[float] = Field(None, description="Similarity score")


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
    sources: Optional[List[Dict[str, Any]]] = Field(None, description="Source documents")
    context: Optional[str] = Field(None, description="Raw context string")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "answer": "ROE là tỷ suất sinh lời trên vốn chủ sở hữu [1].",
                    "is_grounded": True,
                    "citations": [
                        {"number": 1, "source": "glossary", "preview": "ROE là..."}
                    ],
                    "metadata": {
                        "routes": ["glossary"],
                        "is_complex": False,
                        "sub_queries": [],
                        "total_time_ms": 1200,
                        "step_times": {"route": 50, "retrieve": 400, "generate": 750}
                    }
                }
            ]
        }
    }
