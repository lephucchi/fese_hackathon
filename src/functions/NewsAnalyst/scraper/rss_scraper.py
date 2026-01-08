"""
RSS Feed Scraper for Vietnamese Financial News.

Fetches latest articles from RSS feeds of major Vietnamese financial news sources.
Falls back to Google Search if RSS fails.
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import asyncio
import httpx

try:
    import feedparser
except ImportError:
    feedparser = None

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


# Default RSS feeds for Vietnamese financial news
DEFAULT_RSS_FEEDS = {
    "vnexpress_chungkhoan": "https://vnexpress.net/rss/kinh-doanh/chung-khoan.rss",
    "vnexpress_kinhdoanh": "https://vnexpress.net/rss/kinh-doanh.rss",
    "cafef_chungkhoan": "https://cafef.vn/rss/chung-khoan.rss",
    "cafef_thoisu": "https://cafef.vn/rss/thoi-su.rss",
    "vtv_kinhte": "https://vtv.vn/rss/kinh-te.rss",
    "vietnamnews_economy": "https://vietnamnews.vn/rss/economy.rss",
}


class RSSFeedScraper:
    """
    RSS Feed scraper for Vietnamese financial news.
    
    Fetches articles from configured RSS feeds and extracts basic metadata.
    For full content extraction, use ContentExtractor.
    """
    
    def __init__(self, config: NewsAnalystConfig):
        """
        Initialize RSS scraper.
        
        Args:
            config: NewsAnalystConfig instance
        """
        self.config = config
        self.feeds = getattr(config, 'rss_feeds', None) or DEFAULT_RSS_FEEDS
        self.lookback_hours = getattr(config, 'rss_lookback_hours', 24)
        self.timeout = getattr(config, 'request_timeout', 30)
        
        if feedparser is None:
            raise ImportError("feedparser is required. Install with: pip install feedparser")
        
        logger.info(f"RSSFeedScraper initialized with {len(self.feeds)} feeds")
    
    async def fetch_all_feeds(self) -> List[Dict[str, Any]]:
        """
        Fetch articles from all configured RSS feeds.
        
        Returns:
            List of article dictionaries with title, url, published_at, source
        """
        logger.info(f"Fetching from {len(self.feeds)} RSS feeds...")
        
        tasks = []
        for feed_name, feed_url in self.feeds.items():
            task = self._fetch_single_feed(feed_name, feed_url)
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_articles = []
        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
            elif isinstance(result, Exception):
                logger.error(f"Feed fetch error: {result}")
        
        # Deduplicate by URL
        unique_articles = self._deduplicate(all_articles)
        
        # Filter by time
        recent_articles = self._filter_recent(unique_articles)
        
        logger.info(f"Fetched {len(recent_articles)} unique recent articles "
                   f"from {len(all_articles)} total")
        
        return recent_articles
    
    async def _fetch_single_feed(
        self,
        feed_name: str,
        feed_url: str
    ) -> List[Dict[str, Any]]:
        """
        Fetch articles from a single RSS feed.
        
        Args:
            feed_name: Name identifier for the feed
            feed_url: URL of the RSS feed
            
        Returns:
            List of article dictionaries
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(feed_url)
                response.raise_for_status()
                
                feed_content = response.text
                feed = feedparser.parse(feed_content)
                
                articles = []
                for entry in feed.entries:
                    article = self._parse_entry(entry, feed_name)
                    if article:
                        articles.append(article)
                
                logger.debug(f"Feed '{feed_name}': {len(articles)} articles")
                return articles
                
        except Exception as e:
            logger.error(f"Error fetching feed '{feed_name}' ({feed_url}): {e}")
            return []
    
    def _parse_entry(
        self,
        entry: Any,
        source: str
    ) -> Optional[Dict[str, Any]]:
        """
        Parse a single RSS feed entry.
        
        Args:
            entry: feedparser entry object
            source: Source identifier
            
        Returns:
            Article dictionary or None if invalid
        """
        try:
            # Extract URL
            url = getattr(entry, 'link', None)
            if not url:
                return None
            
            # Extract title
            title = getattr(entry, 'title', '')
            if not title:
                return None
            
            # Extract published date
            published_at = self._parse_date(entry)
            
            # Extract summary/description (snippet)
            summary = getattr(entry, 'summary', '') or getattr(entry, 'description', '')
            # Clean HTML from summary
            if summary:
                import re
                summary = re.sub(r'<[^>]+>', '', summary)
                summary = summary.strip()[:500]  # Limit length
            
            return {
                "title": title,
                "url": url,
                "snippet": summary,
                "source": source,
                "published_at": published_at,
                "content": None,  # Will be filled by ContentExtractor
            }
            
        except Exception as e:
            logger.error(f"Error parsing entry: {e}")
            return None
    
    def _parse_date(self, entry: Any) -> Optional[str]:
        """
        Parse published date from RSS entry.
        
        Args:
            entry: feedparser entry object
            
        Returns:
            ISO format date string or None
        """
        # Try different date fields
        date_fields = ['published_parsed', 'updated_parsed', 'created_parsed']
        
        for field in date_fields:
            parsed = getattr(entry, field, None)
            if parsed:
                try:
                    dt = datetime(*parsed[:6])
                    return dt.isoformat()
                except Exception:
                    continue
        
        # Try string fields
        string_fields = ['published', 'updated', 'created']
        for field in string_fields:
            date_str = getattr(entry, field, None)
            if date_str:
                return date_str
        
        # Default to current time
        return datetime.now().isoformat()
    
    def _deduplicate(
        self,
        articles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Remove duplicate articles by URL.
        
        Args:
            articles: List of articles
            
        Returns:
            Deduplicated list
        """
        seen_urls = set()
        unique = []
        
        for article in articles:
            url = article.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique.append(article)
        
        return unique
    
    def _filter_recent(
        self,
        articles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Filter articles to only include recent ones.
        
        Args:
            articles: List of articles
            
        Returns:
            Filtered list (within lookback_hours)
        """
        cutoff = datetime.now() - timedelta(hours=self.lookback_hours)
        recent = []
        
        for article in articles:
            published = article.get("published_at")
            if not published:
                recent.append(article)  # Keep if no date
                continue
            
            try:
                # Parse ISO format
                if isinstance(published, str):
                    # Handle various formats
                    for fmt in [
                        "%Y-%m-%dT%H:%M:%S",
                        "%Y-%m-%dT%H:%M:%S%z",
                        "%Y-%m-%d %H:%M:%S",
                    ]:
                        try:
                            dt = datetime.strptime(published[:19], fmt[:19].replace("%z", ""))
                            if dt > cutoff:
                                recent.append(article)
                            break
                        except ValueError:
                            continue
                    else:
                        # If no format matched, keep the article
                        recent.append(article)
            except Exception:
                recent.append(article)  # Keep if parsing fails
        
        return recent
