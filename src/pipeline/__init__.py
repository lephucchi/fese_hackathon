"""
Pipeline Module - LangGraph RAG Orchestration.

Provides the unified RAG pipeline integrating all components via LangGraph.

Components:
- RAGState: Pipeline state schema
- Nodes: route, decompose, retrieve, generate (+ CAF nodes)
- Graph: StateGraph with conditional edges

Example:
    >>> from src.pipeline import run_rag_pipeline_async
    >>> result = await run_rag_pipeline_async("ROE là gì và VNM có ROE bao nhiêu")
    >>> print(result["answer"])
"""
from .state import RAGState, create_initial_state
from .nodes import route_node, decompose_node, retrieve_node, generate_node
from .graph import build_rag_graph, get_rag_graph, run_rag_pipeline, run_rag_pipeline_async, run_rag_pipeline_streaming

# CAF Nodes (Step 8) - Canonical Answer Framework
from .caf_nodes import (
    extract_facts_node,
    synthesize_answer_node,
    generate_node_caf
)

__all__ = [
    # State
    "RAGState",
    "create_initial_state",
    # Nodes
    "route_node",
    "decompose_node",
    "retrieve_node",
    "generate_node",
    # CAF Nodes (Step 8)
    "extract_facts_node",
    "synthesize_answer_node",
    "generate_node_caf",
    # Graph
    "build_rag_graph",
    "get_rag_graph",
    "run_rag_pipeline",
    "run_rag_pipeline_async",
    "run_rag_pipeline_streaming",
]
