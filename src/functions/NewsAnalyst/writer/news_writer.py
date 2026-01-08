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

from postgrest.exceptions import APIError 

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
    
    def _validate_sentiment(self, raw_sentiment: Any) -> Optional[str]:
        """
        Normalize sentiment to match database constraints.
        Database only accepts: 'Positive', 'Negative', 'Neutral'
        """
        ALLOWED = ["Positive", "Negative", "Neutral"]
        
        if not raw_sentiment or not isinstance(raw_sentiment, str):
            return None
        
        # Convert to Title Case (e.g., "positive" -> "Positive")
        formatted = raw_sentiment.title().strip()
        
        if formatted in ALLOWED:
            return formatted
        
        return None
    
    def _format_tickers(self, tickers: List[Dict[str, Any]]) -> Optional[str]:
        """
        Format ticker list as comma-separated text for database storage.
        
        Args:
            tickers: List of ticker dictionaries with 'ticker' key
            
        Returns:
            Comma-separated ticker string or None if empty
        """
        if not tickers:
            return None
        
        # Extract ticker symbols, filter out empty values
        ticker_symbols = []
        for t in tickers:
            if isinstance(t, dict) and "ticker" in t:
                ticker_symbols.append(t["ticker"])
            elif isinstance(t, str):
                ticker_symbols.append(t)
        
        # Remove duplicates while preserving order
        seen = set()
        unique_tickers = []
        for ticker in ticker_symbols:
            if ticker and ticker not in seen:
                seen.add(ticker)
                unique_tickers.append(ticker)
        
        return ", ".join(unique_tickers) if unique_tickers else None

    def _build_analyst_json(self, article: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Build analyst JSON object with analysis results.
        
        Format:
        {
            "title": "...",
            "url": "...",
            "content": "...",
            "sentiment": "negative",
            "analyze": {
                "polarity": 0.0,
                "subjectivity": 0.0,
                "vader": {"neg": 0.0, "neu": 1.0, "pos": 0.0, "compound": 0.0},
                "vietnamese": {"label": "NEG", "score": 0.713}
            },
            "overall": "negative"
        }
        """
        title = article.get("title", "")
        url = article.get("url", "")
        content = article.get("content", article.get("snippet", "")) or ""
        
        # Get sentiment data from PhoBERT/FinBERT analysis
        sentiment_data = article.get("sentiment", {})
        if not sentiment_data or not isinstance(sentiment_data, dict):
            sentiment_data = {"sentiment": "neutral", "confidence": 0.5, "scores": {}}
        
        # Extract values
        overall = sentiment_data.get("sentiment", "neutral") or "neutral"
        confidence = sentiment_data.get("confidence", 0.5)
        scores = sentiment_data.get("scores", {})
        
        # Ensure confidence is float
        try:
            confidence = float(confidence)
        except (ValueError, TypeError):
            confidence = 0.5
        
        # Map sentiment to short label
        label_map = {"positive": "POS", "negative": "NEG", "neutral": "NEU"}
        vi_label = label_map.get(overall.lower(), "NEU")
        
        # Calculate polarity from scores (-1 to 1)
        pos_score = scores.get("positive", 0.33)
        neg_score = scores.get("negative", 0.33)
        polarity = pos_score - neg_score
        
        # Calculate compound score (similar to VADER)
        compound = polarity  # Simplified
        if overall.lower() == "positive":
            compound = abs(polarity)
        elif overall.lower() == "negative":
            compound = -abs(polarity) if polarity != 0 else -0.5
        
        analyst_json = {
            "title": title,
            "url": url,
            "content": content[:500] if len(content) > 500 else content,
            "sentiment": overall.lower(),
            "analyze": {
                "polarity": round(polarity, 4),
                "subjectivity": round(confidence, 4),  # Use confidence as proxy
                "vader": {
                    "neg": round(neg_score, 4),
                    "neu": round(scores.get("neutral", 0.34), 4),
                    "pos": round(pos_score, 4),
                    "compound": round(compound, 4)
                },
                "vietnamese": {
                    "label": vi_label,
                    "score": round(confidence, 16)
                }
            },
            "overall": overall.lower()
        }
        
        return analyst_json

    async def _insert_news(self, article: Dict[str, Any]) -> Optional[str]:
        """
        Insert news article into news table.
        
        Args:
            article: Article dictionary
            
        Returns:
            news_id if successful, None otherwise
        """
        try:
            # Process sentiment before sending to database
            raw_sentiment = article.get("sentiment", {}).get("sentiment")
            final_sentiment = self._validate_sentiment(raw_sentiment)

            # Format tickers for database
            ticker_text = self._format_tickers(article.get("tickers", []))
            
            # Build analyst JSON
            analyst_json = self._build_analyst_json(article)
            logger.debug(f"Analyst JSON built: {analyst_json is not None}")
            
            # Prepare data
            data = {
                "title": article.get("title", ""),
                "content": article.get("content", article.get("snippet", "")),
                "source_url": article.get("url"),
                "published_at": article.get("published_at"),
                "sentiment": final_sentiment,
                "Ticker": ticker_text,  # Write detected tickers to database
            }
            
            # Add analyst JSON if available
            if analyst_json:
                data["analyst"] = analyst_json
                logger.debug(f"Adding analyst column with keys: {list(analyst_json.keys())}")
            
            # Insert
            response = self.supabase.table("news")\
                .insert(data)\
                .execute()
            
            if response.data:
                news_id = response.data[0]["news_id"]
                logger.debug(f"Inserted article: {news_id}")
                return news_id
                
        except APIError as e:
            # Log detailed Supabase error for debugging
            error_details = e.message if hasattr(e, 'message') else str(e)
            if hasattr(e, 'details'):
                error_details += f" | Details: {e.details}"
            if hasattr(e, 'hint'):
                 error_details += f" | Hint: {e.hint}"

            logger.error(f"SUPABASE API ERROR: {error_details}")
            
            # Don't raise exception to allow processing of other articles
            return None

        except Exception as e:
            logger.error(f"Error inserting news (General): {e}")
        
        return None
    
    async def _insert_ticker_mappings(
        self,
        news_id: str,
        tickers: List[Dict[str, Any]]
    ):
        """
        Insert news-ticker mappings.
        
        Only inserts stock tickers (not macro indicators) to avoid
        foreign key constraint violations.
        
        Args:
            news_id: News article ID
            tickers: List of ticker dictionaries
        """
        try:
            # Filter out macro indicators - only insert stock tickers
            # that exist in the market_data table
            stock_tickers = [
                t for t in tickers 
                if t.get("type") == "stock"
            ]
            
            if not stock_tickers:
                logger.debug(f"No stock tickers to map for {news_id}")
                return
            
            mappings = [
                {
                    "news_id": news_id,
                    "ticker": ticker["ticker"]
                }
                for ticker in stock_tickers
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