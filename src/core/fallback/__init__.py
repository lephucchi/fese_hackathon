"""
External Search Fallback Module.

This module provides fallback mechanisms when internal retrieval
doesn't provide sufficient coverage.

Components:
- FallbackDecider: Determines if web search is needed
- GoogleSearchGrounding: Executes grounded search via Gemini
"""
from .decider import FallbackDecider, FallbackDecision
from .google_search import GoogleSearchGrounding

__all__ = [
    "FallbackDecider",
    "FallbackDecision", 
    "GoogleSearchGrounding",
]
