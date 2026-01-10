"""
LangGraph State Definition for RAG Pipeline.

Updated for Canonical Answer Framework (CAF) - Step 8.
Updated for External Search Fallback - Step 9.
"""
from typing import TypedDict, List, Optional, Dict, Any


class RAGState(TypedDict):
    """
    State schema for the RAG pipeline.
    
    This state flows through all nodes in the graph.
    Updated to support Canonical Answer Framework (CAF).
    Updated to support External Search Fallback.
    Updated to support Rate Limiting (Phase 4).
    """
    # Input
    query: str
    
    # NEW: User context for rate limiting
    user_id: Optional[str]
    
    # Routing
    routes: List[str]
    route_scores: Dict[str, float]
    
    # Decomposition  
    is_complex: bool
    sub_queries: List[str]
    sub_query_types: List[str]
    
    # Retrieval
    contexts: List[Dict[str, Any]]
    formatted_context: str
    citations_map: List[Dict[str, Any]]
    
    # NEW: Sub-query organized contexts for CAF
    sub_query_contexts: Dict[str, str]  # {sub_query: formatted_context}
    
    # NEW: Canonical Facts (CAF Pass 1 output)
    canonical_facts: List[Dict[str, Any]]  # List of CanonicalFact dicts
    
    # NEW: Fallback (Step 9)
    fallback_decision: Optional[Dict[str, Any]]  # FallbackDecision as dict
    web_contexts: List[Dict[str, Any]]           # Results from Google Search
    fallback_used: bool
    fallback_error: Optional[str]
    
    # NEW: Rate Limiting (Phase 4)
    rate_limit_exceeded: bool
    rate_limit_retry_after: Optional[int]
    
    # Generation (CAF Pass 2 output)
    answer: str
    citations: List[Dict[str, Any]]
    is_grounded: bool
    
    # Metadata
    total_time_ms: float
    step_times: Dict[str, float]
    error: Optional[str]
    
    # NEW: Execution Logs (Phase 4) used for UI "Thought Process"
    logs: List[Dict[str, Any]]  # [{"step": "route", "detail": "...", "metadata": {}}]


def create_initial_state(query: str, user_id: Optional[str] = None) -> RAGState:
    """Create initial state from query."""
    return RAGState(
        query=query,
        user_id=user_id,
        routes=[],
        route_scores={},
        is_complex=False,
        sub_queries=[],
        sub_query_types=[],
        contexts=[],
        formatted_context="",
        citations_map=[],
        sub_query_contexts={},  # CAF
        canonical_facts=[],      # CAF
        fallback_decision=None,  # Fallback
        web_contexts=[],         # Fallback
        fallback_used=False,     # Fallback
        fallback_error=None,     # Fallback
        rate_limit_exceeded=False,  # Rate Limiting
        rate_limit_retry_after=None,  # Rate Limiting
        answer="",
        citations=[],
        is_grounded=False,
        total_time_ms=0.0,
        step_times={},
        error=None,
        logs=[]  # Initialize logs
    )
