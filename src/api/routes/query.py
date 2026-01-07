"""
Query routes - RAG query processing endpoints.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends

from ..schemas.requests import QueryRequest
from ..schemas.responses import QueryResponse, ErrorResponse, Citation, ResponseMetadata
from ..services import QueryService
from ..dependencies import get_router, get_retriever

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Query"], prefix="/query")


def get_query_service(
    router_instance=Depends(get_router),
    retriever_instance=Depends(get_retriever)
) -> QueryService:
    """Dependency to get QueryService instance."""
    return QueryService(router_instance, retriever_instance)


@router.post(
    "",
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
async def process_query(
    request: QueryRequest,
    query_service: QueryService = Depends(get_query_service)
):
    """Process query through RAG pipeline."""
    try:
        logger.info(f"Received query: {request.query[:50]}...")
        
        # Extract options
        options = request.options or QueryRequest.model_fields['options'].default
        
        # Process query via service
        result = await query_service.process_query(
            query=request.query,
            max_docs=options.max_docs if options else 10,
            include_sources=options.include_sources if options else True,
            include_context=options.include_context if options else False
        )
        
        # Build response
        response = QueryResponse(
            answer=result["answer"],
            is_grounded=result["is_grounded"],
            citations=[Citation(**c) for c in result["citations"]],
            metadata=ResponseMetadata(**result["metadata"]),
            sources=result.get("sources"),
            context=result.get("context")
        )
        
        logger.info(f"Query completed in {result['metadata']['total_time_ms']:.0f}ms")
        return response
        
    except Exception as e:
        logger.error(f"Query processing error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "processing_error", "message": str(e)}
        )


@router.get(
    "/routes",
    response_model=dict,
    summary="Predict routes for a query",
    description="Get routing predictions without full query processing"
)
async def get_query_routes(
    query: str,
    query_service: QueryService = Depends(get_query_service)
):
    """Get route predictions for a query."""
    try:
        routes = await query_service.get_routes(query)
        return {"query": query, "routes": routes}
        
    except Exception as e:
        logger.error(f"Route prediction error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "routing_error", "message": str(e)}
        )


@router.post(
    "/decompose",
    response_model=dict,
    summary="Decompose complex query",
    description="Decompose query into sub-queries without full processing"
)
async def decompose_query(
    request: QueryRequest,
    query_service: QueryService = Depends(get_query_service)
):
    """Decompose complex query into sub-queries."""
    try:
        result = await query_service.decompose_query(request.query)
        return {
            "query": request.query,
            "is_complex": result["is_complex"],
            "sub_queries": result["sub_queries"]
        }
        
    except Exception as e:
        logger.error(f"Decomposition error: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "decomposition_error", "message": str(e)}
        )
