"""
Scraper module for news retrieval.

Uses Google Custom Search API to retrieve financial news articles.
"""
from .google_searcher import GoogleNewsSearcher

__all__ = ["GoogleNewsSearcher"]
