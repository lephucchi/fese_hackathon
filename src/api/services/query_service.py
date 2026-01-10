"""
Query Service - Business logic for RAG query processing.

Orchestrates the entire RAG pipeline:
1. Route query to appropriate indices
2. Decompose complex queries
3. Retrieve relevant documents
4. Generate grounded answer
"""
import logging
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class QueryService:
    """Service for processing RAG queries."""
    
    def __init__(self, router, retriever):
        """
        Initialize query service.
        
        Args:
            router: HybridRouter instance for query routing
            retriever: ParallelRetriever instance for document retrieval
        """
        self.router = router
        self.retriever = retriever
    
    async def process_query(
        self,
        query: str,
        user_id: str = "anonymous",
        max_docs: int = 10,
        include_sources: bool = True,
        include_context: bool = False
    ) -> Dict[str, Any]:
        """
        Process query through full RAG pipeline.
        
        Args:
            query: User question
            user_id: User identifier for rate limiting (default: "anonymous")
            max_docs: Maximum documents to retrieve
            include_sources: Whether to include source documents
            include_context: Whether to include raw context
            
        Returns:
            Complete RAG response with answer, citations, metadata
        """
        try:
            logger.info(f"Processing query: {query[:50]}... (user: {user_id})")
            
            # Use existing pipeline WITH user_id for rate limiting
            from src.pipeline import run_rag_pipeline_async
            result = await run_rag_pipeline_async(query, user_id=user_id)
            
            # Format response
            formatted_result = self._format_response(
                result,
                include_sources=include_sources,
                include_context=include_context
            )
            
            logger.info(f"Query processed in {result.get('total_time_ms', 0):.0f}ms")
            return formatted_result
            
        except Exception as e:
            logger.error(f"Query processing error: {e}", exc_info=True)
            raise
    
    def _format_response(
        self,
        pipeline_result: Dict[str, Any],
        include_sources: bool,
        include_context: bool
    ) -> Dict[str, Any]:
        """
        Format pipeline result for API response.
        
        Args:
            pipeline_result: Raw pipeline output
            include_sources: Whether to include sources
            include_context: Whether to include context
            
        Returns:
            Formatted response dict
        """
        response = {
            "answer": pipeline_result.get("answer", ""),
            "is_grounded": pipeline_result.get("is_grounded", False),
            "citations": pipeline_result.get("citations_map", []),
            "metadata": {
                "routes": pipeline_result.get("routes", []),
                "is_complex": pipeline_result.get("is_complex", False),
                "sub_queries": pipeline_result.get("sub_queries", []),
                "total_time_ms": pipeline_result.get("total_time_ms", 0.0),
                "step_times": pipeline_result.get("step_times", {})
            }
        }
        
        if include_sources:
            response["sources"] = pipeline_result.get("contexts", [])
        
        if include_context:
            response["context"] = pipeline_result.get("formatted_context", "")
        
        return response
    
    async def get_routes(self, query: str) -> List[str]:
        """
        Get route predictions for a query without full processing.
        
        Args:
            query: User question
            
        Returns:
            List of predicted index names
        """
        routes = self.router.route(query)
        return routes
    
    async def decompose_query(self, query: str) -> Dict[str, Any]:
        """
        Decompose complex query into sub-queries without full processing.
        
        Args:
            query: User question
            
        Returns:
            Decomposition result with is_complex and sub_queries
        """
        from src.core.decomposition import QueryDecomposer
        
        decomposer = QueryDecomposer()
        result = await decomposer.decompose(query)
        
        return {
            "is_complex": result.get("is_complex", False),
            "sub_queries": result.get("sub_queries", [query])
        }
