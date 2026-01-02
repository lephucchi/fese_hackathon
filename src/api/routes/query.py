"""
Query Route Handler.
"""
import logging
from fastapi import APIRouter, HTTPException

from ..schemas import QueryRequest, QueryResponse, Citation, ResponseMetadata, ErrorResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Query"])


@router.post(
    "/query",
    response_model=QueryResponse,
    responses={
        200: {"description": "Successful response"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Process a query through the RAG pipeline",
    description="""
    Send a natural language query and receive a grounded answer with citations.
    
    The pipeline:
    1. **Route** - Classifies query to appropriate indices
    2. **Decompose** - Breaks complex queries into sub-queries (if needed)
    3. **Retrieve** - Fetches relevant documents from vector indices
    4. **Generate** - Creates grounded answer with citations
    """
)
async def query(request: QueryRequest):
    """Process query through RAG pipeline."""
    try:
        from src.pipeline import run_rag_pipeline_async
        
        logger.info(f"Processing query: {request.query[:50]}...")
        
        # Run pipeline (now using async version)
        result = await run_rag_pipeline_async(request.query)
        
        # Build citations
        citations = []
        if request.options is None or request.options.include_sources:
            for cit in result.get("citations_map", []):
                citations.append(Citation(
                    number=cit.get("number", 0),
                    source=cit.get("source", "unknown"),
                    preview=cit.get("preview", "")[:200],
                    similarity=cit.get("similarity")
                ))
        
        # Build metadata
        metadata = ResponseMetadata(
            routes=result.get("routes", []),
            is_complex=result.get("is_complex", False),
            sub_queries=result.get("sub_queries", []),
            total_time_ms=result.get("total_time_ms", 0.0),
            step_times=result.get("step_times", {})
        )
        
        # Build response
        response = QueryResponse(
            answer=result.get("answer", ""),
            is_grounded=result.get("is_grounded", False),
            citations=citations,
            metadata=metadata,
        )
        
        # Optional fields
        if request.options:
            if request.options.include_sources:
                response.sources = result.get("contexts", [])
            if request.options.include_context:
                response.context = result.get("formatted_context", "")
        
        logger.info(f"Query processed in {metadata.total_time_ms:.0f}ms")
        return response
        
    except Exception as e:
        logger.error(f"Query error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "processing_error", "message": str(e)}
        )
