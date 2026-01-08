"""
News Repository - Data access layer for news table.

Handles all database operations for news management.
"""
from typing import Optional, List, Dict, Any
from supabase import Client

from .base import BaseRepository


class NewsRepository(BaseRepository):
    """Repository for news table operations."""
    
    def __init__(self, supabase: Client):
        """
        Initialize news repository.
        
        Args:
            supabase: Supabase client instance
        """
        super().__init__(supabase, "news")
    
    async def find_by_id(self, news_id: str) -> Optional[Dict[str, Any]]:
        """
        Find news article by news_id.
        
        Args:
            news_id: UUID of news article
            
        Returns:
            News dict with ticker mappings if found, None otherwise
        """
        response = self.supabase.table(self.table_name)\
            .select("*, news_stock_mapping(ticker)")\
            .eq("news_id", news_id)\
            .execute()
        
        if response.data:
            return self._format_news_with_tickers(response.data[0])
        return None
    
    async def find_all(
        self,
        limit: int = 20,
        offset: int = 0,
        sentiment: Optional[str] = None,
        order_by: str = "published_at",
        ascending: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Find all news articles with pagination and optional filters.
        
        Args:
            limit: Maximum number of articles to return
            offset: Number of articles to skip
            sentiment: Optional filter by sentiment
            order_by: Column to order by
            ascending: Sort direction
            
        Returns:
            List of news dicts with ticker mappings
        """
        query = self.supabase.table(self.table_name)\
            .select("*, news_stock_mapping(ticker)")
        
        if sentiment:
            query = query.eq("sentiment", sentiment)
        
        query = query.order(order_by, desc=not ascending)
        query = query.range(offset, offset + limit - 1)
        
        response = query.execute()
        return [self._format_news_with_tickers(item) for item in response.data]
    
    async def find_by_ticker(
        self,
        ticker: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """
        Find news articles by stock ticker.
        
        Args:
            ticker: Stock ticker symbol
            limit: Maximum articles to return
            offset: Number to skip
            
        Returns:
            List of news articles related to the ticker
        """
        # First get news_ids from mapping table
        mapping_response = self.supabase.table("news_stock_mapping")\
            .select("news_id")\
            .eq("ticker", ticker.upper())\
            .execute()
        
        if not mapping_response.data:
            return []
        
        news_ids = [m["news_id"] for m in mapping_response.data]
        
        # Then get news details
        response = self.supabase.table(self.table_name)\
            .select("*, news_stock_mapping(ticker)")\
            .in_("news_id", news_ids)\
            .order("published_at", desc=True)\
            .range(offset, offset + limit - 1)\
            .execute()
        
        return [self._format_news_with_tickers(item) for item in response.data]
    
    async def find_by_ids(self, news_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Find multiple news articles by list of IDs.
        
        Args:
            news_ids: List of news UUIDs
            
        Returns:
            List of news dicts with ticker mappings and analyst
        """
        if not news_ids:
            return []
        
        response = self.supabase.table(self.table_name)\
            .select("*, news_stock_mapping(ticker)")\
            .in_("news_id", news_ids)\
            .order("published_at", desc=True)\
            .execute()
        
        return [self._format_news_with_tickers(item) for item in response.data]
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """
        Count total news articles.
        
        Args:
            filters: Optional filters to apply
            
        Returns:
            Total count
        """
        query = self.supabase.table(self.table_name)\
            .select("news_id", count="exact")
        
        if filters:
            for field, value in filters.items():
                query = query.eq(field, value)
        
        response = query.execute()
        return response.count if hasattr(response, 'count') and response.count else len(response.data)
    
    async def count_by_ticker(self, ticker: str) -> int:
        """
        Count news articles for a specific ticker.
        
        Args:
            ticker: Stock ticker symbol
            
        Returns:
            Count of news for this ticker
        """
        response = self.supabase.table("news_stock_mapping")\
            .select("news_id", count="exact")\
            .eq("ticker", ticker.upper())\
            .execute()
        
        return response.count if hasattr(response, 'count') and response.count else len(response.data)
    
    async def get_sentiment_stats(self, ticker: Optional[str] = None) -> Dict[str, int]:
        """
        Get sentiment statistics.
        
        Args:
            ticker: Optional ticker to filter by
            
        Returns:
            Dict with positive, negative, neutral counts
        """
        stats = {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
        
        if ticker:
            # Get news_ids for this ticker first
            mapping_response = self.supabase.table("news_stock_mapping")\
                .select("news_id")\
                .eq("ticker", ticker.upper())\
                .execute()
            
            if not mapping_response.data:
                return stats
            
            news_ids = [m["news_id"] for m in mapping_response.data]
            
            for sentiment in ["positive", "negative", "neutral"]:
                response = self.supabase.table(self.table_name)\
                    .select("news_id", count="exact")\
                    .in_("news_id", news_ids)\
                    .eq("sentiment", sentiment)\
                    .execute()
                count = response.count if hasattr(response, 'count') and response.count else len(response.data)
                stats[sentiment] = count
                stats["total"] += count
        else:
            for sentiment in ["positive", "negative", "neutral"]:
                response = self.supabase.table(self.table_name)\
                    .select("news_id", count="exact")\
                    .eq("sentiment", sentiment)\
                    .execute()
                count = response.count if hasattr(response, 'count') and response.count else len(response.data)
                stats[sentiment] = count
                stats["total"] += count
        
        return stats
    
    async def get_top_tickers(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get most mentioned tickers.
        
        Args:
            limit: Number of top tickers to return
            
        Returns:
            List of dicts with ticker and count
        """
        # Get all mappings
        response = self.supabase.table("news_stock_mapping")\
            .select("ticker")\
            .execute()
        
        if not response.data:
            return []
        
        # Count occurrences
        ticker_counts = {}
        for item in response.data:
            ticker = item["ticker"]
            ticker_counts[ticker] = ticker_counts.get(ticker, 0) + 1
        
        # Sort and limit
        sorted_tickers = sorted(
            ticker_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]
        
        return [{"ticker": t, "count": c} for t, c in sorted_tickers]
    
    def _format_news_with_tickers(self, news_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Format news data with extracted tickers.
        
        Args:
            news_data: Raw news data from database
            
        Returns:
            Formatted news dict with tickers list
        """
        tickers = []
        if "news_stock_mapping" in news_data and news_data["news_stock_mapping"]:
            mappings = news_data["news_stock_mapping"]
            if isinstance(mappings, list):
                tickers = [{"ticker": m["ticker"], "confidence": None} for m in mappings]
            del news_data["news_stock_mapping"]
        
        news_data["tickers"] = tickers
        return news_data
