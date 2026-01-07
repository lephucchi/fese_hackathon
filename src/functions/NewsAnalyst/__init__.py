"""
NewsAnalyst Engine - Automated News Scraping & Sentiment Analysis System.

This engine automatically scrapes financial news, analyzes sentiment using
FinBERT + PhoBERT, and updates Supabase database every 4-6 hours.

Architecture:
    - Scraper: Google Custom Search API for news retrieval
    - Analyzer: FinBERT (English) + PhoBERT (Vietnamese) for sentiment
    - Scheduler: APScheduler for automated runs
    - Database: Supabase for persistent storage

Author: Team Multi-Index RAG
Date: January 2026
"""

__version__ = "1.0.0"
__author__ = "Multi-Index RAG Team"

from .pipeline import NewsAnalystPipeline
from .config import NewsAnalystConfig

__all__ = ["NewsAnalystPipeline", "NewsAnalystConfig"]
