"""
LangGraph State Graph Definition.

This is the main entry point for the RAG pipeline.
Full pipeline: Query → Route → Decompose → Retrieve → [Fallback?] → Generate → Answer

Updated for Canonical Answer Framework (CAF) - Step 8.
Updated for External Search Fallback - Step 9.
"""
import logging
import os
from typing import Dict, Any

from .state import RAGState, create_initial_state
from .nodes import (
    route_node, decompose_node, retrieve_node, generate_node,
    should_decompose,
    # Fallback nodes (Step 9)
    fallback_check_node, google_search_node, should_fallback
)
# CAF nodes
from .caf_nodes import (
    extract_facts_node, synthesize_answer_node, generate_node_caf
)

logger = logging.getLogger(__name__)

# Check if langgraph is installed
try:
    from langgraph.graph import StateGraph, END
    LANGGRAPH_AVAILABLE = True
except ImportError:
    LANGGRAPH_AVAILABLE = False
    logger.warning("langgraph not installed. Install with: pip install langgraph")


# Feature flag for CAF - can be set via environment variable
CAF_ENABLED = os.getenv("CAF_ENABLED", "true").lower() in ("true", "1", "yes")

# Feature flag for Fallback - can be set via environment variable
FALLBACK_ENABLED = os.getenv("FALLBACK_ENABLED", "true").lower() in ("true", "1", "yes")


def build_rag_graph(use_caf: bool = None, use_fallback: bool = None):
    """
    Build the RAG pipeline graph.
    
    Flow (Original):
        START → route → [decompose?] → retrieve → generate → END
    
    Flow (CAF):
        START → route → [decompose?] → retrieve → extract_facts → synthesize → END
    
    Flow (with Fallback):
        START → route → [decompose?] → retrieve → fallback_check → 
        [if low confidence] → google_search → generate → END
    
    Args:
        use_caf: Override CAF_ENABLED setting (default: None uses env var)
        use_fallback: Override FALLBACK_ENABLED setting (default: None uses env var)
    
    Returns:
        Compiled StateGraph ready for invocation.
    """
    if not LANGGRAPH_AVAILABLE:
        raise ImportError("langgraph not installed")
    
    # Determine feature flags
    enable_caf = use_caf if use_caf is not None else CAF_ENABLED
    enable_fallback = use_fallback if use_fallback is not None else FALLBACK_ENABLED
    
    # Create graph with state schema
    graph = StateGraph(RAGState)
    
    # Add core nodes
    graph.add_node("route", route_node)
    graph.add_node("decompose", decompose_node)
    graph.add_node("retrieve", retrieve_node)
    
    # Add fallback nodes if enabled
    if enable_fallback:
        logger.info("Building RAG graph with External Search Fallback")
        graph.add_node("fallback_check", fallback_check_node)
        graph.add_node("google_search", google_search_node)
    
    # Add generation node (CAF or original)
    if enable_caf:
        logger.info("Building RAG graph with CAF (2-pass generation)")
        graph.add_node("generate", generate_node_caf)
    else:
        logger.info("Building RAG graph with original generation")
        graph.add_node("generate", generate_node)
    
    # Set entry point
    graph.set_entry_point("route")
    
    # Conditional edges: route → decompose OR retrieve
    graph.add_conditional_edges(
        "route",
        should_decompose,
        {
            True: "decompose",
            False: "retrieve"
        }
    )
    
    # Linear edge: decompose → retrieve
    graph.add_edge("decompose", "retrieve")
    
    # Fallback path or direct to generate
    if enable_fallback:
        # retrieve → fallback_check
        graph.add_edge("retrieve", "fallback_check")
        
        # Conditional: fallback_check → google_search OR generate
        graph.add_conditional_edges(
            "fallback_check",
            should_fallback,
            {
                True: "google_search",
                False: "generate"
            }
        )
        
        # google_search → generate
        graph.add_edge("google_search", "generate")
    else:
        # Direct: retrieve → generate
        graph.add_edge("retrieve", "generate")
    
    # Final edge
    graph.add_edge("generate", END)
    
    # Compile
    return graph.compile()


# Singleton instance
_compiled_graph = None
_graph_caf_enabled = None


def get_rag_graph(use_caf: bool = None):
    """
    Get or create the compiled RAG graph.
    
    Args:
        use_caf: Override CAF_ENABLED setting (default: None uses env var)
    """
    global _compiled_graph, _graph_caf_enabled
    
    # Determine CAF setting
    enable_caf = use_caf if use_caf is not None else CAF_ENABLED
    
    # Rebuild if CAF setting changed
    if _compiled_graph is None or _graph_caf_enabled != enable_caf:
        logger.info(f"Building RAG graph (CAF={enable_caf})...")
        _compiled_graph = build_rag_graph(use_caf=enable_caf)
        _graph_caf_enabled = enable_caf
        logger.info("RAG graph ready.")
    return _compiled_graph


def run_rag_pipeline(query: str, use_caf: bool = None) -> Dict[str, Any]:
    """
    Run a query through the full RAG pipeline (sync wrapper).
    
    Args:
        query: User question
        use_caf: Override CAF_ENABLED setting
        
    Returns:
        Dict with answer, citations, and metadata
    """
    import asyncio
    
    # Check if there's a running event loop
    try:
        loop = asyncio.get_running_loop()
        # If we're already in an async context, use the async version directly
        # This should be called from async code instead
        raise RuntimeError(
            "run_rag_pipeline should not be called from async context. "
            "Use run_rag_pipeline_async instead."
        )
    except RuntimeError as e:
        if "no running event loop" in str(e).lower():
            # No running loop, safe to use asyncio.run()
            return asyncio.run(run_rag_pipeline_async(query, use_caf=use_caf))
        else:
            # Re-raise the error about wrong usage
            raise


async def run_rag_pipeline_async(
    query: str, 
    user_id: str = "anonymous", 
    use_caf: bool = None,
    user_query: str = None
) -> Dict[str, Any]:
    """
    Run a query through the full RAG pipeline (async version).
    
    Args:
        query: User question (may be augmented with context)
        user_id: User identifier for rate limiting (default: "anonymous")
        use_caf: Override CAF_ENABLED setting
        user_query: Original user query before augmentation (for fallback detection)
        
    Returns:
        Dict with answer, citations, and metadata (includes canonical_facts if CAF)
    """
    graph = get_rag_graph(use_caf=use_caf)
    initial_state = create_initial_state(query, user_id=user_id)
    
    # Preserve original user query for fallback detection
    if user_query:
        initial_state["user_query"] = user_query
    
    # Use ainvoke for async execution
    result = await graph.ainvoke(initial_state)
    
    response = {
        "query": result["query"],
        "answer": result["answer"],
        "is_grounded": result["is_grounded"],
        "citations": result.get("citations", []),
        "routes": result["routes"],
        "sub_queries": result["sub_queries"],
        "is_complex": result["is_complex"],
        "contexts": result["contexts"],
        "formatted_context": result["formatted_context"],
        "citations_map": result["citations_map"],
        "step_times": result["step_times"],
        "citations_map": result["citations_map"],
        "step_times": result["step_times"],
        "total_time_ms": result.get("total_time_ms", 0.0),
        "logs": result.get("logs", [])  # NEW: Logs for UI
    }
    
    # Include CAF-specific fields if available
    if "canonical_facts" in result and result["canonical_facts"]:
        response["canonical_facts"] = result["canonical_facts"]
    if "sub_query_contexts" in result and result["sub_query_contexts"]:
        response["sub_query_contexts"] = result["sub_query_contexts"]
    
    # Include fallback-specific fields (Step 9)
    if result.get("fallback_used"):
        response["fallback_used"] = result["fallback_used"]
        response["web_contexts"] = result.get("web_contexts", [])
        response["fallback_decision"] = result.get("fallback_decision")
        if result.get("fallback_error"):
            response["fallback_error"] = result["fallback_error"]
    
    return response


# Fallback for when langgraph is not installed
def run_rag_pipeline_fallback(query: str, use_caf: bool = None) -> Dict[str, Any]:
    """Fallback pipeline without LangGraph."""
    import asyncio
    
    # Determine generation function
    enable_caf = use_caf if use_caf is not None else CAF_ENABLED
    gen_node = generate_node_caf if enable_caf else generate_node
    
    state = create_initial_state(query)
    
    # Manual pipeline execution
    state = route_node(state)
    if should_decompose(state):
        state = decompose_node(state)
    
    # retrieve_node is async, need to run it properly
    state = asyncio.run(retrieve_node(state))
    
    state = gen_node(state)
    
    response = {
        "query": state["query"],
        "answer": state["answer"],
        "is_grounded": state["is_grounded"],
        "citations": state.get("citations", []),
        "routes": state["routes"],
        "sub_queries": state["sub_queries"],
        "is_complex": state["is_complex"],
        "contexts": state["contexts"],
        "formatted_context": state["formatted_context"],
        "citations_map": state["citations_map"],
        "step_times": state["step_times"],
        "total_time_ms": state.get("total_time_ms", 0.0),
    }
    
    if enable_caf and "canonical_facts" in state:
        response["canonical_facts"] = state["canonical_facts"]
    
    return response
