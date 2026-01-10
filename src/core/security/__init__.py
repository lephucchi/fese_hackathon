"""
Security module for Multi-Index RAG Finance.

Provides query validation and security checks to prevent:
- LLM injection attacks
- System probing
- Off-topic abuse
- Malicious queries
"""
from .query_guard import QueryGuard, QueryGuardResult, get_query_guard

__all__ = ["QueryGuard", "QueryGuardResult", "get_query_guard"]
