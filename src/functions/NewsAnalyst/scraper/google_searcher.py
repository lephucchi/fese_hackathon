"""
Google Custom Search scraper for Vietnamese financial news.

Uses Google Custom Search API to retrieve news articles from specified sources.
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import asyncio
import httpx

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


class GoogleNewsSearcher:
    """
    Google Custom Search API wrapper for financial news.
    
    Searches specified Vietnamese news sites for financial content
    using Google Custom Search API.
    """
    
    def __init__(self, config: NewsAnalystConfig):
        """
        Initialize searcher.
        
        Args:
            config: NewsAnalystConfig instance
        """
        self.config = config
        self.api_key = config.google_api_key
        self.search_engine_id = config.google_search_engine_id
        self.base_url = "https://www.googleapis.com/customsearch/v1"
        
        logger.info("GoogleNewsSearcher initialized")
    
    async def search_news(
        self,
        query: str = "chứng khoán",
        num_results: int = 10,
        date_restrict: str = "d1"  # Last 1 day
    ) -> List[Dict[str, Any]]:
        """
        Search for news articles.
        
        Args:
            query: Search query (default: stock market related)
            num_results: Number of results to retrieve
            date_restrict: Date restriction (d1=1day, d7=7days)
            
        Returns:
            List of article dictionaries with title, link, snippet, date
        """
        async with httpx.AsyncClient(timeout=self.config.request_timeout) as client:
            params = {
                "key": self.api_key,
                "cx": self.search_engine_id,
                "q": query,
                "num": min(num_results, 10),  # Google API max is 10
                "dateRestrict": date_restrict,
                "lr": "lang_vi",  # Vietnamese language
                "sort": "date"  # Sort by date
            }
            
            try:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                items = data.get("items", [])
                
                articles = []
                for item in items:
                    article = self._parse_search_item(item)
                    if article:
                        articles.append(article)
                
                logger.info(f"Found {len(articles)} articles for query: {query}")
                return articles
                
            except Exception as e:
                logger.error(f"Error searching news: {e}")
                return []
    
    async def search_multiple_sources(
        self,
        sources: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search news from multiple sources concurrently.
        
        Args:
            sources: List of news site domains (e.g., ['cafef.vn'])
            
        Returns:
            Combined list of articles from all sources
        """
        if sources is None:
            sources = self.config.news_sources
        
        tasks = []
        for source in sources:
            query = f"site:{source} chứng khoán OR cổ phiếu"
            task = self.search_news(
                query=query,
                num_results=self.config.max_results_per_source
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_articles = []
        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
            else:
                logger.error(f"Error in search task: {result}")
        
        logger.info(f"Total articles found: {len(all_articles)}")
        return all_articles
    
    def _parse_search_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse Google Search API result item.
        
        Args:
            item: Search result item from API
            
        Returns:
            Parsed article dictionary or None if invalid
        """
        try:
            # Extract metadata
            pagemap = item.get("pagemap", {})
            metatags = pagemap.get("metatags", [{}])[0]
            
            article = {
                "title": item.get("title", ""),
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "source": self._extract_domain(item.get("link", "")),
                "published_at": self._extract_date(metatags),
                "raw_data": item  # Keep for debugging
            }
            
            # Validate required fields
            if not article["title"] or not article["url"]:
                return None
            
            return article
            
        except Exception as e:
            logger.error(f"Error parsing search item: {e}")
            return None
    
    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc.replace("www.", "")
        except Exception:
            return "unknown"
    
    @staticmethod
    def _extract_date(metatags: Dict[str, Any]) -> Optional[str]:
        """
        Extract publication date from metatags.
        
        Args:
            metatags: Metadata from pagemap
            
        Returns:
            ISO format date string or None
        """
        date_fields = [
            "article:published_time",
            "datePublished",
            "publishdate",
            "date"
        ]
        
        for field in date_fields:
            if field in metatags:
                return metatags[field]
        
        # Default to current time if not found
        return datetime.now().isoformat()
