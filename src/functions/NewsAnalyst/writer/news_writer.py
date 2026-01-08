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
        
        New Format (no duplicate data):
        {
            "finbert": {"sentiment": "positive", "confidence": 0.87, "scores": {...}},
            "phobert": {"sentiment": "positive", "confidence": 0.91, "scores": {...}},
            "average": {"sentiment": "positive", "confidence": 0.89, "scores": {...}},
            "tickers": ["VNM", "VCB"],  # Must match Ticker column
            "keywords": ["VN-Index", "tăng mạnh"],
            "analyzed_at": "2026-01-08T15:00:00Z"
        }
        """
        # Get individual model results
        finbert_data = article.get("finbert_sentiment", {})
        phobert_data = article.get("phobert_sentiment", {})
        
        # If using old single sentiment format, convert it
        if not finbert_data and not phobert_data:
            old_sentiment = article.get("sentiment", {})
            if isinstance(old_sentiment, dict):
                # Determine which model was used based on language
                language = article.get("language", "vi")
                if language == "vi":
                    phobert_data = old_sentiment
                else:
                    finbert_data = old_sentiment
        
        # Build FinBERT result
        finbert_result = self._format_model_sentiment(finbert_data, "finbert")
        
        # Build PhoBERT result
        phobert_result = self._format_model_sentiment(phobert_data, "phobert")
        
        # Calculate average
        average_result = self._calculate_average_sentiment(finbert_result, phobert_result)
        
        # Get tickers as list (must match Ticker column)
        tickers_data = article.get("tickers", [])
        ticker_list = self._extract_ticker_list(tickers_data)
        
        # Get keywords
        keywords = article.get("keywords", [])
        if not keywords:
            # Extract keywords from ticker detection if available
            keywords = self._extract_keywords_from_tickers(tickers_data)
        
        analyst_json = {
            "finbert": finbert_result,
            "phobert": phobert_result,
            "average": average_result,
            "tickers": ticker_list,
            "keywords": keywords,
            "analyzed_at": datetime.now().isoformat()
        }
        
        return analyst_json
    
    def _format_model_sentiment(
        self, 
        sentiment_data: Dict[str, Any], 
        model_name: str
    ) -> Dict[str, Any]:
        """
        Format sentiment data from a single model.
        
        Args:
            sentiment_data: Raw sentiment data from model
            model_name: Model identifier (finbert/phobert)
            
        Returns:
            Formatted sentiment dictionary
        """
        if not sentiment_data or not isinstance(sentiment_data, dict):
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "scores": {"positive": 0.0, "negative": 0.0, "neutral": 1.0}
            }
        
        sentiment = str(sentiment_data.get("sentiment", "neutral")).lower()
        confidence = float(sentiment_data.get("confidence", 0.5))
        scores = sentiment_data.get("scores", {})
        
        return {
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "scores": {
                "positive": round(float(scores.get("positive", 0.0)), 4),
                "negative": round(float(scores.get("negative", 0.0)), 4),
                "neutral": round(float(scores.get("neutral", 0.0)), 4)
            }
        }
    
    def _calculate_average_sentiment(
        self,
        finbert_result: Dict[str, Any],
        phobert_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculate average sentiment from both models.
        
        Args:
            finbert_result: Formatted FinBERT result
            phobert_result: Formatted PhoBERT result
            
        Returns:
            Average sentiment dictionary
        """
        # Get scores from both models
        fb_scores = finbert_result.get("scores", {})
        pb_scores = phobert_result.get("scores", {})
        fb_conf = finbert_result.get("confidence", 0.0)
        pb_conf = phobert_result.get("confidence", 0.0)
        
        # Count active models
        active_models = 0
        if fb_conf > 0:
            active_models += 1
        if pb_conf > 0:
            active_models += 1
        
        if active_models == 0:
            return {
                "sentiment": "neutral",
                "confidence": 0.0,
                "scores": {"positive": 0.0, "negative": 0.0, "neutral": 1.0}
            }
        
        # Calculate averages
        avg_pos = (fb_scores.get("positive", 0) + pb_scores.get("positive", 0)) / active_models
        avg_neg = (fb_scores.get("negative", 0) + pb_scores.get("negative", 0)) / active_models
        avg_neu = (fb_scores.get("neutral", 0) + pb_scores.get("neutral", 0)) / active_models
        avg_conf = (fb_conf + pb_conf) / active_models
        
        # Determine overall sentiment
        max_score = max(avg_pos, avg_neg, avg_neu)
        if max_score == avg_pos:
            sentiment = "positive"
        elif max_score == avg_neg:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "sentiment": sentiment,
            "confidence": round(avg_conf, 4),
            "scores": {
                "positive": round(avg_pos, 4),
                "negative": round(avg_neg, 4),
                "neutral": round(avg_neu, 4)
            }
        }
    
    def _extract_ticker_list(self, tickers_data: List[Any]) -> List[str]:
        """
        Extract ticker symbols as list (synced with Ticker column).
        
        Args:
            tickers_data: Raw tickers data from article
            
        Returns:
            List of ticker symbols
        """
        if not tickers_data:
            return []
        
        ticker_list = []
        seen = set()
        
        for t in tickers_data:
            ticker = None
            if isinstance(t, dict):
                ticker = t.get("ticker")
            elif isinstance(t, str):
                ticker = t
            
            if ticker and ticker not in seen:
                seen.add(ticker)
                ticker_list.append(ticker)
        
        return ticker_list
    
    def _extract_keywords_from_tickers(
        self, 
        tickers_data: List[Any]
    ) -> List[str]:
        """
        Extract keywords from ticker detection context.
        
        Args:
            tickers_data: Raw tickers data with context
            
        Returns:
            List of keywords
        """
        keywords = set()
        
        for t in tickers_data:
            if isinstance(t, dict):
                # Add context if available
                context = t.get("context", "")
                if context:
                    # Extract significant words
                    words = context.split()
                    for word in words:
                        if len(word) > 3:
                            keywords.add(word.lower())
        
        return list(keywords)[:10]  # Limit to 10 keywords

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
        Insert news-ticker mappings to link news with market_data.
        
        Validates that tickers exist in market_data table before inserting
        to avoid foreign key constraint violations.
        
        Flow: news -> news_stock_mapping -> market_data
        
        Args:
            news_id: News article ID
            tickers: List of ticker dictionaries
        """
        try:
            if not tickers:
                logger.debug(f"No tickers to map for {news_id}")
                return
            
            # Extract unique ticker symbols
            ticker_symbols = set()
            for t in tickers:
                ticker = None
                if isinstance(t, dict):
                    # Only include stock tickers, not macro indicators
                    if t.get("type") == "stock":
                        ticker = t.get("ticker")
                elif isinstance(t, str):
                    ticker = t
                
                if ticker:
                    ticker_symbols.add(ticker)
            
            if not ticker_symbols:
                logger.debug(f"No stock tickers to map for {news_id}")
                return
            
            # Validate tickers exist in market_data table
            valid_tickers = await self._validate_tickers_in_market_data(list(ticker_symbols))
            
            if not valid_tickers:
                logger.debug(f"No valid tickers in market_data for {news_id}")
                return
            
            # Build mappings for valid tickers only
            mappings = [
                {
                    "news_id": news_id,
                    "ticker": ticker
                }
                for ticker in valid_tickers
            ]
            
            # Insert mappings
            response = self.supabase.table("news_stock_mapping")\
                .insert(mappings)\
                .execute()
            
            logger.info(f"Linked {len(mappings)} tickers to news {news_id}: {valid_tickers}")
            
        except Exception as e:
            logger.error(f"Error inserting ticker mappings: {e}")
    
    async def _validate_tickers_in_market_data(
        self,
        tickers: List[str]
    ) -> List[str]:
        """
        Validate that tickers exist in market_data table.
        
        Args:
            tickers: List of ticker symbols to validate
            
        Returns:
            List of tickers that exist in market_data
        """
        try:
            # Query market_data for these tickers
            response = self.supabase.table("market_data")\
                .select("ticker")\
                .in_("ticker", tickers)\
                .execute()
            
            if response.data:
                valid = [row["ticker"] for row in response.data]
                logger.debug(f"Validated {len(valid)}/{len(tickers)} tickers in market_data")
                return valid
            
            return []
            
        except Exception as e:
            logger.error(f"Error validating tickers: {e}")
            return []
    
    @staticmethod
    def _hash_content(content: str) -> str:
        """Generate SHA256 hash of content."""
        return hashlib.sha256(content.encode()).hexdigest()