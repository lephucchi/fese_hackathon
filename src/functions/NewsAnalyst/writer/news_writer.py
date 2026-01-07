"""
Database writer for news articles and related data.

Handles insertion into Supabase tables:
- news
- news_stock_mapping  
- news_index (with embeddings)
"""
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
import hashlib
from supabase import Client

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


class NewsWriter:
    """
    Write news articles and metadata to Supabase.
    
    Handles deduplication, transaction management, and bulk inserts.
    """
    
    def __init__(self, config: NewsAnalystConfig, supabase: Client):
        """
        Initialize writer.
        
        Args:
            config: NewsAnalystConfig instance
            supabase: Supabase client
        """
        self.config = config
        self.supabase = supabase
        
        logger.info("NewsWriter initialized")
    
    async def write_articles(
        self,
        articles: List[Dict[str, Any]]
    ) -> Dict[str, int]:
        """
        Write articles to database.
        
        Args:
            articles: List of article dictionaries with:
                - title, content, url, sentiment, tickers, etc.
                
        Returns:
            Statistics: inserted, duplicates, errors
        """
        stats = {
            "inserted": 0,
            "duplicates": 0,
            "errors": 0
        }
        
        for article in articles:
            try:
                # Check for duplicates
                if self.config.enable_deduplication:
                    if await self._is_duplicate(article):
                        stats["duplicates"] += 1
                        continue
                
                # Insert article
                news_id = await self._insert_news(article)
                
                if news_id:
                    # Insert ticker mappings
                    if article.get("tickers"):
                        await self._insert_ticker_mappings(
                            news_id,
                            article["tickers"]
                        )
                    
                    # TODO: Generate and insert embeddings
                    
                    stats["inserted"] += 1
                else:
                    stats["errors"] += 1
                    
            except Exception as e:
                logger.error(f"Error writing article: {e}")
                stats["errors"] += 1
        
        logger.info(f"Write complete: {stats}")
        return stats
    
    async def _is_duplicate(self, article: Dict[str, Any]) -> bool:
        """
        Check if article already exists in database.
        
        Args:
            article: Article dictionary
            
        Returns:
            True if duplicate exists
        """
        try:
            # Check by URL
            if article.get("url"):
                response = self.supabase.table("news")\
                    .select("news_id")\
                    .eq("source_url", article["url"])\
                    .execute()
                
                if response.data:
                    return True
            
            # Check by content hash
            content_hash = self._hash_content(article.get("content", ""))
            # TODO: Store and check content_hash in database
            
        except Exception as e:
            logger.error(f"Error checking duplicate: {e}")
        
        return False
    
    async def _insert_news(self, article: Dict[str, Any]) -> Optional[str]:
        """
        Insert news article into news table.
        
        Args:
            article: Article dictionary
            
        Returns:
            news_id if successful, None otherwise
        """
        try:
            # Prepare data
            data = {
                "title": article.get("title", ""),
                "content": article.get("content", article.get("snippet", "")),
                "source_url": article.get("url"),
                "published_at": article.get("published_at"),
                "sentiment": article.get("sentiment", {}).get("sentiment"),
                # TODO: Add more fields as needed
            }
            
            # Insert
            response = self.supabase.table("news")\
                .insert(data)\
                .execute()
            
            if response.data:
                news_id = response.data[0]["news_id"]
                logger.debug(f"Inserted article: {news_id}")
                return news_id
                
        except Exception as e:
            logger.error(f"Error inserting news: {e}")
        
        return None
    
    async def _insert_ticker_mappings(
        self,
        news_id: str,
        tickers: List[Dict[str, Any]]
    ):
        """
        Insert news-ticker mappings.
        
        Args:
            news_id: News article ID
            tickers: List of ticker dictionaries
        """
        try:
            mappings = [
                {
                    "news_id": news_id,
                    "ticker": ticker["ticker"]
                }
                for ticker in tickers
            ]
            
            response = self.supabase.table("news_stock_mapping")\
                .insert(mappings)\
                .execute()
            
            logger.debug(f"Inserted {len(mappings)} ticker mappings for {news_id}")
            
        except Exception as e:
            logger.error(f"Error inserting ticker mappings: {e}")
    
    @staticmethod
    def _hash_content(content: str) -> str:
        """Generate SHA256 hash of content."""
        return hashlib.sha256(content.encode()).hexdigest()
