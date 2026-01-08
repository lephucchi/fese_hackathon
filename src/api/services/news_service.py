"""
News Service - Business logic for news operations.

Handles all news-related business logic between routes and repository.
"""
import logging
from typing import Dict, Any, List, Optional

from ..repositories.news_repository import NewsRepository

logger = logging.getLogger(__name__)


class NewsService:
    """Service for news operations."""
    
    def __init__(self, news_repository: NewsRepository):
        """
        Initialize news service.
        
        Args:
            news_repository: NewsRepository instance for data access
        """
        self.news_repo = news_repository
    
    async def get_news_list(
        self,
        page: int = 1,
        page_size: int = 10,
        sentiment: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Get paginated list of news articles.
        
        Args:
            page: Page number (1-indexed)
            page_size: Items per page
            sentiment: Optional filter by sentiment
            
        Returns:
            Dict with news list and pagination info
        """
        offset = (page - 1) * page_size
        
        news_data = await self.news_repo.find_all(
            limit=page_size,
            offset=offset,
            sentiment=sentiment
        )
        
        filters = {"sentiment": sentiment} if sentiment else None
        total = await self.news_repo.count(filters)
        
        has_next = offset + page_size < total
        
        return {
            "news": news_data,
            "total": total,
            "page": page,
            "page_size": page_size,
            "has_next": has_next
        }
    
    async def get_news_by_id(self, news_id: str) -> Optional[Dict[str, Any]]:
        """
        Get single news article by ID.
        
        Args:
            news_id: UUID of news article
            
        Returns:
            News dict if found, None otherwise
        """
        return await self.news_repo.find_by_id(news_id)
    
    async def get_news_by_ticker(
        self,
        ticker: str,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """
        Get news articles for a specific stock ticker.
        
        Args:
            ticker: Stock ticker symbol
            page: Page number
            page_size: Items per page
            
        Returns:
            Dict with news list, total, and sentiment summary
        """
        ticker_upper = ticker.upper()
        offset = (page - 1) * page_size
        
        news_data = await self.news_repo.find_by_ticker(
            ticker=ticker_upper,
            limit=page_size,
            offset=offset
        )
        
        total = await self.news_repo.count_by_ticker(ticker_upper)
        sentiment_data = await self.news_repo.get_sentiment_stats(ticker=ticker_upper)
        
        return {
            "ticker": ticker_upper,
            "news": news_data,
            "total": total,
            "sentiment_summary": sentiment_data
        }
    
    async def get_news_stats(self) -> Dict[str, Any]:
        """
        Get overall news statistics.
        
        Returns:
            Dict with total count, sentiment stats, and top tickers
        """
        total = await self.news_repo.count()
        sentiment_data = await self.news_repo.get_sentiment_stats()
        top_tickers = await self.news_repo.get_top_tickers(limit=10)
        
        return {
            "total_news": total,
            "sentiment_stats": sentiment_data,
            "top_tickers": top_tickers,
            "latest_crawl_at": None  # TODO: Track last crawl time
        }
