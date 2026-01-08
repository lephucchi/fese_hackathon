"""
Main pipeline orchestrator for NewsAnalyst engine.

Coordinates scraping, analysis, and database writing.
"""
import logging
from typing import Dict, Any, List
from supabase import create_client

from .config import NewsAnalystConfig
from .scraper import GoogleNewsSearcher
from .analyzer import FinBERTAnalyzer, PhoBERTAnalyzer, TickerDetector
from .writer import NewsWriter

logger = logging.getLogger(__name__)


class NewsAnalystPipeline:
    """
    Main pipeline for news scraping and analysis.
    
    Orchestrates:
    1. Scraping news from Google Custom Search
    2. Sentiment analysis with FinBERT/PhoBERT
    3. Ticker detection and mapping
    4. Database writing
    """
    
    def __init__(self, config: NewsAnalystConfig = None):
        """
        Initialize pipeline.
        
        Args:
            config: NewsAnalystConfig instance (optional)
        """
        self.config = config or NewsAnalystConfig()
        self.config.validate()
        
        # Initialize Supabase client
        self.supabase = create_client(
            self.config.supabase_url,
            self.config.supabase_key
        )
        
        # Initialize components
        self.searcher = GoogleNewsSearcher(self.config, self.supabase)
        self.finbert = FinBERTAnalyzer(self.config)
        self.phobert = PhoBERTAnalyzer(self.config)
        self.ticker_detector = TickerDetector(self.config, self.supabase)
        self.writer = NewsWriter(self.config, self.supabase)
        
        logger.info("NewsAnalystPipeline initialized")
    
    async def run(self) -> Dict[str, Any]:
        """
        Run complete pipeline.
        
        Returns:
            Statistics dictionary with counts and metrics
        """
        logger.info("Starting pipeline execution...")
        
        stats = {
            "scraped": 0,
            "analyzed": 0,
            "inserted": 0,
            "duplicates": 0,
            "errors": 0
        }
        
        try:
            # Step 1: Scrape news (comprehensive search with priorities)
            logger.info("Step 1: Scraping news with comprehensive search...")
            articles = await self.searcher.search_comprehensive(
                enable_market=self.config.enable_market_search,
                enable_macro=self.config.enable_macro_search,
                enable_tickers=self.config.enable_ticker_search,
                top_tickers_count=self.config.top_tickers_count
            )
            stats["scraped"] = len(articles)
            logger.info(f"Scraped {stats['scraped']} articles")
            
            if not articles:
                logger.warning("No articles found, exiting")
                return stats
            
            # Step 2: Analyze articles
            logger.info("Step 2: Analyzing articles...")
            analyzed_articles = await self._analyze_articles(articles)
            stats["analyzed"] = len(analyzed_articles)
            logger.info(f"Analyzed {stats['analyzed']} articles")
            
            # Step 3: Write to database
            logger.info("Step 3: Writing to database...")
            write_stats = await self.writer.write_articles(analyzed_articles)
            stats.update(write_stats)
            logger.info(f"Write stats: {write_stats}")
            
            logger.info("Pipeline execution completed successfully")
            
        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}", exc_info=True)
            stats["errors"] += 1
        
        return stats
    
    async def _analyze_articles(
        self,
        articles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Analyze articles with sentiment and ticker detection.
        
        Args:
            articles: List of raw article dictionaries
            
        Returns:
            List of analyzed article dictionaries
        """
        analyzed = []
        
        for article in articles:
            try:
                # Determine language (simple heuristic)
                text = article.get("title", "") + " " + article.get("snippet", "")
                is_vietnamese = self._is_vietnamese(text)
                
                # Sentiment analysis
                if is_vietnamese:
                    sentiment = self.phobert.analyze(text)
                else:
                    sentiment = self.finbert.analyze(text)
                
                # Ticker detection
                tickers = self.ticker_detector.detect_tickers(text)
                
                # Combine results
                article["sentiment"] = sentiment
                article["tickers"] = tickers
                article["language"] = "vi" if is_vietnamese else "en"
                
                analyzed.append(article)
                
            except Exception as e:
                logger.error(f"Error analyzing article: {e}")
                continue
        
        return analyzed
    
    @staticmethod
    def _is_vietnamese(text: str) -> bool:
        """
        Simple heuristic to detect Vietnamese text.
        
        Args:
            text: Text to check
            
        Returns:
            True if likely Vietnamese
        """
        vietnamese_chars = "àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ"
        
        # Count Vietnamese characters
        viet_count = sum(1 for char in text.lower() if char in vietnamese_chars)
        
        # If >5% Vietnamese characters, consider it Vietnamese
        return (viet_count / len(text)) > 0.05 if text else False
