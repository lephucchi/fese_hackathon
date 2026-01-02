"""
Core Module - Business Logic Components.

Contains all core RAG components:
- router: Query routing to indices
- decomposition: Query breakdown
- retrieval: Vector search
- generator: Answer generation (Step 5)
"""
from .router import HybridRouter, SemanticRouter, create_router
from .decomposition import QueryDecomposer, QueryComplexityClassifier
from .retrieval import ParallelRetriever, ResultFusion

__all__ = [
    # Router
    "HybridRouter",
    "SemanticRouter",
    "create_router",
    # Decomposition
    "QueryDecomposer",
    "QueryComplexityClassifier",
    # Retrieval
    "ParallelRetriever",
    "ResultFusion",
]
