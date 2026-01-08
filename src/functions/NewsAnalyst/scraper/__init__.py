"""
Scraper module for news retrieval.

Supports:
- RSS Feed scraping (primary)
- Google Custom Search API (fallback)
- Full article content extraction
"""
from .google_searcher import GoogleNewsSearcher
from .rss_scraper import RSSFeedScraper
from .content_extractor import ArticleContentExtractor

__all__ = ["GoogleNewsSearcher", "RSSFeedScraper", "ArticleContentExtractor"]
