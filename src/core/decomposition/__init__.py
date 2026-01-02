"""
Decomposition Module - Query Complexity Classification and Decomposition.

Breaks complex queries into atomic sub-queries for better retrieval.
"""
from .classifier import QueryComplexityClassifier, ClassificationResult
from .decomposer import QueryDecomposer, DecompositionResult, SubQuery

__all__ = [
    "QueryComplexityClassifier",
    "ClassificationResult",
    "QueryDecomposer",
    "DecompositionResult",
    "SubQuery",
]
