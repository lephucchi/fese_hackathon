"""
Article Content Extractor.

Extracts full article content from URLs using trafilatura.
"""
import logging
from typing import Dict, Any, Optional, List
import asyncio
from concurrent.futures import ThreadPoolExecutor

try:
    import trafilatura
except ImportError:
    trafilatura = None

import httpx

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


class ArticleContentExtractor:
    """
    Extract full article content from URLs.
    
    Uses trafilatura for robust content extraction that handles
    Vietnamese text well.
    """
    
    def __init__(self, config: NewsAnalystConfig = None):
        """
        Initialize content extractor.
        
        Args:
            config: Optional NewsAnalystConfig instance
        """
        self.config = config
        self.timeout = getattr(config, 'extraction_timeout', 30) if config else 30
        self.max_content_length = getattr(config, 'max_content_length', 10000) if config else 10000
        self.executor = ThreadPoolExecutor(max_workers=5)
        
        if trafilatura is None:
            raise ImportError("trafilatura is required. Install with: pip install trafilatura")
        
        logger.info("ArticleContentExtractor initialized")
    
    async def extract(self, url: str) -> Optional[Dict[str, Any]]:
        """
        Extract full content from a single URL.
        
        Args:
            url: Article URL to extract content from
            
        Returns:
            Dictionary with text, title, author, date, or None if failed
        """
        try:
            # Fetch HTML
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(url, follow_redirects=True)
                response.raise_for_status()
                html = response.text
            
            # Extract content using trafilatura (run in executor for sync lib)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(
                self.executor,
                self._extract_from_html,
                html,
                url
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error extracting content from {url}: {e}")
            return None
    
    def _extract_from_html(self, html: str, url: str) -> Optional[Dict[str, Any]]:
        """
        Extract content from HTML using trafilatura.
        
        Args:
            html: HTML content
            url: Original URL for metadata
            
        Returns:
            Dictionary with extracted data
        """
        try:
            # Extract main text
            text = trafilatura.extract(
                html,
                include_comments=False,
                include_tables=True,
                no_fallback=False,
            )
            
            if not text:
                logger.warning(f"No content extracted from {url}")
                return None
            
            # Truncate if too long
            if len(text) > self.max_content_length:
                text = text[:self.max_content_length] + "..."
            
            # Extract metadata
            metadata = trafilatura.extract_metadata(html)
            
            result = {
                "text": text,
                "title": metadata.title if metadata else None,
                "author": metadata.author if metadata else None,
                "date": metadata.date if metadata else None,
                "sitename": metadata.sitename if metadata else None,
            }
            
            logger.debug(f"Extracted {len(text)} chars from {url}")
            return result
            
        except Exception as e:
            logger.error(f"trafilatura extraction error: {e}")
            return None
    
    async def extract_batch(
        self,
        urls: List[str],
        concurrency: int = 5
    ) -> Dict[str, Optional[Dict[str, Any]]]:
        """
        Extract content from multiple URLs concurrently.
        
        Args:
            urls: List of URLs to extract
            concurrency: Maximum concurrent extractions
            
        Returns:
            Dictionary mapping URL to extracted content
        """
        semaphore = asyncio.Semaphore(concurrency)
        results = {}
        
        async def extract_with_semaphore(url: str):
            async with semaphore:
                result = await self.extract(url)
                results[url] = result
        
        tasks = [extract_with_semaphore(url) for url in urls]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        logger.info(f"Extracted content from {sum(1 for v in results.values() if v)} / {len(urls)} URLs")
        return results
    
    async def enrich_articles(
        self,
        articles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Enrich articles with full content.
        
        Args:
            articles: List of article dictionaries with 'url' key
            
        Returns:
            Articles with 'content' field populated
        """
        urls = [a.get("url") for a in articles if a.get("url")]
        
        # Extract content for all URLs
        extracted = await self.extract_batch(urls)
        
        # Update articles with content
        for article in articles:
            url = article.get("url")
            if url and url in extracted and extracted[url]:
                content_data = extracted[url]
                article["content"] = content_data.get("text", "")
                
                # Update title if extracted one is better
                if content_data.get("title") and len(content_data["title"]) > len(article.get("title", "")):
                    article["title"] = content_data["title"]
        
        return articles
