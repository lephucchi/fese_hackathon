"""
Market Repository - Data access layer for market analytics.

Handles queries for news stack, analytics, and aggregations.
"""
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from supabase import Client

logger = logging.getLogger(__name__)


class MarketRepository:
    """Repository for market analytics operations."""
    
    def __init__(self, supabase: Client):
        """
        Initialize market repository.
        
        Args:
            supabase: Supabase client instance
        """
        self.supabase = supabase
    
    async def get_news_stack(
        self,
        user_id: str,
        limit: int = 20,
        excluded_ids: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Get news stack for swipe (without content).
        
        Returns news that user hasn't interacted with yet.
        
        Args:
            user_id: User UUID to exclude interacted news
            limit: Maximum news to return
            excluded_ids: Additional IDs to exclude
            
        Returns:
            List of news for stack (no content field)
        """
        try:
            # First get IDs user already interacted with
            interactions = self.supabase.table("user_interactions")\
                .select("news_id")\
                .eq("user_id", user_id)\
                .execute()
            
            interacted_ids = [r["news_id"] for r in (interactions.data or [])]
            
            if excluded_ids:
                interacted_ids.extend(excluded_ids)
            
            # Build query for uninteracted news
            query = self.supabase.table("news")\
                .select("news_id, title, content, sentiment, published_at, analyst, Ticker")\
                .order("published_at", desc=True)\
                .limit(limit)
            
            # Exclude already interacted (if any)
            if interacted_ids:
                query = query.not_.in_("news_id", interacted_ids)
            
            response = query.execute()
            
            # Format response with keywords and tickers
            stack = []
            for news in (response.data or []):
                stack.append(self._format_stack_item(news))
            
            return stack
            
        except Exception as e:
            logger.error(f"Error getting news stack: {e}")
            return []
    
    def _format_stack_item(self, news: Dict[str, Any]) -> Dict[str, Any]:
        """Format news for stack display (no content)."""
        analyst = news.get("analyst") or {}
        
        # Extract keywords from analyst
        keywords = analyst.get("keywords", [])
        
        # Extract tickers
        tickers = []
        ticker_str = news.get("Ticker", "")
        if ticker_str:
            tickers = [t.strip() for t in ticker_str.split(",") if t.strip()]
        
        # Also check analyst tickers
        if analyst.get("tickers"):
            for t in analyst.get("tickers", []):
                if t not in tickers:
                    tickers.append(t)
        
        # Determine sentiment color
        sentiment = news.get("sentiment", "neutral")
        sentiment_color = self._get_sentiment_color(sentiment)
        
        return {
            "news_id": news["news_id"],
            "title": news.get("title", ""),
            "content": news.get("content", ""),
            "sentiment": sentiment,
            "sentiment_color": sentiment_color,
            "keywords": keywords[:5],  # Limit to 5 keywords
            "tickers": tickers[:5],    # Limit to 5 tickers
            "published_at": news.get("published_at")
        }
    
    def _get_sentiment_color(self, sentiment: str) -> str:
        """Get color for sentiment."""
        colors = {
            "Positive": "#2ECC71",  # Green
            "positive": "#2ECC71",
            "Negative": "#E74C3C",  # Red
            "negative": "#E74C3C",
            "Neutral": "#F39C12",   # Yellow/Orange
            "neutral": "#F39C12"
        }
        return colors.get(sentiment, "#95A5A6")  # Gray default
    
    async def get_analytics(
        self,
        period: str = "week",
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Get market analytics data.
        
        Args:
            period: Period type ('day', 'week', 'month')
            days: Number of days to analyze
            
        Returns:
            Analytics dict with timeline, top keywords, top tickers
        """
        try:
            # Calculate date range
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get news in period
            response = self.supabase.table("news")\
                .select("news_id, title, sentiment, published_at, analyst, Ticker")\
                .gte("published_at", start_date.isoformat())\
                .order("published_at", desc=True)\
                .execute()
            
            news_list = response.data or []
            
            # Build analytics
            analytics = {
                "period": period,
                "summary": self._build_summary(news_list),
                "top_keywords": self._aggregate_keywords(news_list),
                "top_tickers": await self._aggregate_tickers(news_list),
                "sentiment_timeline": self._build_timeline(news_list, days),
                "industry_heatmap": await self._build_industry_heatmap(news_list)
            }
            
            return analytics
            
        except Exception as e:
            logger.error(f"Error getting analytics: {e}")
            return {"error": str(e)}
    
    def _build_summary(self, news_list: List[Dict]) -> Dict[str, Any]:
        """Build summary stats."""
        total = len(news_list)
        
        # Calculate average sentiment
        sentiment_scores = []
        for n in news_list:
            s = n.get("sentiment", "").lower()
            if s == "positive":
                sentiment_scores.append(1.0)
            elif s == "negative":
                sentiment_scores.append(-1.0)
            else:
                sentiment_scores.append(0.0)
        
        avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
        
        return {
            "total_articles": total,
            "avg_sentiment": round(avg_sentiment, 2)
        }
    
    def _aggregate_keywords(self, news_list: List[Dict], limit: int = 10) -> List[Dict]:
        """Aggregate top keywords."""
        keyword_stats = {}
        
        for news in news_list:
            analyst = news.get("analyst") or {}
            keywords = analyst.get("keywords", [])
            sentiment = news.get("sentiment", "").lower()
            
            score = 1.0 if sentiment == "positive" else (-1.0 if sentiment == "negative" else 0.0)
            
            for kw in keywords:
                kw_lower = kw.lower()
                if kw_lower not in keyword_stats:
                    keyword_stats[kw_lower] = {"count": 0, "sentiment_sum": 0}
                keyword_stats[kw_lower]["count"] += 1
                keyword_stats[kw_lower]["sentiment_sum"] += score
        
        # Sort by count
        sorted_keywords = sorted(
            keyword_stats.items(),
            key=lambda x: x[1]["count"],
            reverse=True
        )[:limit]
        
        return [
            {
                "keyword": kw,
                "count": stats["count"],
                "sentiment_avg": round(stats["sentiment_sum"] / stats["count"], 2) if stats["count"] > 0 else 0
            }
            for kw, stats in sorted_keywords
        ]
    
    async def _aggregate_tickers(self, news_list: List[Dict], limit: int = 10) -> List[Dict]:
        """Aggregate top tickers with company info."""
        ticker_stats = {}
        
        for news in news_list:
            ticker_str = news.get("Ticker", "")
            sentiment = news.get("sentiment", "").lower()
            score = 1.0 if sentiment == "positive" else (-1.0 if sentiment == "negative" else 0.0)
            
            if ticker_str:
                tickers = [t.strip() for t in ticker_str.split(",") if t.strip()]
                for t in tickers:
                    if t not in ticker_stats:
                        ticker_stats[t] = {"mentions": 0, "sentiment_sum": 0}
                    ticker_stats[t]["mentions"] += 1
                    ticker_stats[t]["sentiment_sum"] += score
        
        # Sort by mentions
        sorted_tickers = sorted(
            ticker_stats.items(),
            key=lambda x: x[1]["mentions"],
            reverse=True
        )[:limit]
        
        # Get company names from market_data
        result = []
        for ticker, stats in sorted_tickers:
            company = await self._get_company_name(ticker)
            result.append({
                "ticker": ticker,
                "mentions": stats["mentions"],
                "sentiment": round(stats["sentiment_sum"] / stats["mentions"], 2) if stats["mentions"] > 0 else 0,
                "company": company
            })
        
        return result
    
    async def _get_company_name(self, ticker: str) -> str:
        """Get company name from market_data."""
        try:
            response = self.supabase.table("market_data")\
                .select("company_name")\
                .eq("ticker", ticker)\
                .limit(1)\
                .execute()
            
            if response.data:
                return response.data[0].get("company_name", ticker)
            return ticker
            
        except Exception:
            return ticker
    
    def _build_timeline(self, news_list: List[Dict], days: int) -> List[Dict]:
        """Build sentiment timeline by date."""
        from collections import defaultdict
        
        # Group by date
        date_stats = defaultdict(lambda: {"positive": 0, "negative": 0, "neutral": 0})
        
        for news in news_list:
            published = news.get("published_at", "")
            if published:
                date_str = published[:10]  # YYYY-MM-DD
                sentiment = news.get("sentiment", "neutral").lower()
                
                if sentiment == "positive":
                    date_stats[date_str]["positive"] += 1
                elif sentiment == "negative":
                    date_stats[date_str]["negative"] += 1
                else:
                    date_stats[date_str]["neutral"] += 1
        
        # Sort by date
        timeline = [
            {"date": date, **counts}
            for date, counts in sorted(date_stats.items())
        ]
        
        return timeline
    
    async def _build_industry_heatmap(self, news_list: List[Dict]) -> List[Dict]:
        """Build industry heatmap from ticker data."""
        # Get tickers and their industries from market_data
        ticker_set = set()
        for news in news_list:
            ticker_str = news.get("Ticker", "")
            if ticker_str:
                for t in ticker_str.split(","):
                    if t.strip():
                        ticker_set.add(t.strip())
        
        if not ticker_set:
            return []
        
        # Fetch industries
        try:
            response = self.supabase.table("market_data")\
                .select("ticker, industry")\
                .in_("ticker", list(ticker_set))\
                .execute()
            
            ticker_industry = {r["ticker"]: r.get("industry", "Unknown") for r in (response.data or [])}
            
        except Exception:
            ticker_industry = {}
        
        # Aggregate by industry
        industry_stats = {}
        for news in news_list:
            ticker_str = news.get("Ticker", "")
            sentiment = news.get("sentiment", "").lower()
            score = 1.0 if sentiment == "positive" else (-1.0 if sentiment == "negative" else 0.0)
            
            if ticker_str:
                for t in ticker_str.split(","):
                    t = t.strip()
                    if t in ticker_industry:
                        ind = ticker_industry[t]
                        if ind not in industry_stats:
                            industry_stats[ind] = {"articles": 0, "sentiment_sum": 0}
                        industry_stats[ind]["articles"] += 1
                        industry_stats[ind]["sentiment_sum"] += score
        
        # Format result
        return [
            {
                "industry": ind,
                "articles": stats["articles"],
                "sentiment": round(stats["sentiment_sum"] / stats["articles"], 2) if stats["articles"] > 0 else 0
            }
            for ind, stats in sorted(industry_stats.items(), key=lambda x: x[1]["articles"], reverse=True)
        ][:10]
    
    async def count_remaining_stack(self, user_id: str) -> int:
        """Count remaining uninteracted news."""
        try:
            # Get total news
            total_response = self.supabase.table("news")\
                .select("news_id", count="exact")\
                .execute()
            
            total = total_response.count or 0
            
            # Get interacted count
            interactions = self.supabase.table("user_interactions")\
                .select("news_id", count="exact")\
                .eq("user_id", user_id)\
                .execute()
            
            interacted = interactions.count or 0
            
            return max(0, total - interacted)
            
        except Exception:
            return 0
