"""
Main pipeline orchestrator for NewsAnalyst engine.

Coordinates scraping, analysis, and database writing.
Supports RSS feeds (primary) with Google Search fallback.
"""
import logging
from typing import Dict, Any, List
from supabase import create_client

from .config import NewsAnalystConfig
from .scraper import GoogleNewsSearcher, RSSFeedScraper, ArticleContentExtractor
from .analyzer import FinBERTAnalyzer, PhoBERTAnalyzer, TickerDetector
from .writer import NewsWriter

logger = logging.getLogger(__name__)


class NewsAnalystPipeline:
    """
    Main pipeline for news scraping and analysis.
    
    Orchestrates:
    1. Scraping news from RSS feeds (primary) or Google Search (fallback)
    2. Full content extraction from article URLs
    3. Dual sentiment analysis with FinBERT and PhoBERT
    4. Ticker detection and keyword extraction
    5. Database writing
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
        
        # Initialize scrapers
        self.rss_scraper = None
        self.content_extractor = None
        try:
            self.rss_scraper = RSSFeedScraper(self.config)
            self.content_extractor = ArticleContentExtractor(self.config)
        except ImportError as e:
            logger.warning(f"RSS/Content modules not available: {e}")
        
        # Google Search as fallback
        self.google_searcher = GoogleNewsSearcher(self.config, self.supabase)
        
        # Initialize analyzers
        self.finbert = FinBERTAnalyzer(self.config)
        self.phobert = PhoBERTAnalyzer(self.config)
        self.ticker_detector = TickerDetector(self.config, self.supabase)
        
        # Initialize writer
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
            "content_extracted": 0,
            "analyzed": 0,
            "inserted": 0,
            "duplicates": 0,
            "errors": 0,
            "source": "unknown"
        }
        
        try:
            # Step 1: Scrape news (RSS primary, Google fallback)
            articles = await self._scrape_articles(stats)
            
            if not articles:
                logger.warning("No articles found, exiting")
                return stats
            
            # Step 1.5: Early deduplication - skip articles already in DB
            original_count = len(articles)
            articles = await self._filter_existing_articles(articles)
            stats["duplicates"] = original_count - len(articles)
            logger.info(f"Filtered {stats['duplicates']} existing articles, {len(articles)} new")
            
            if not articles:
                logger.info("No new articles to process after deduplication")
                return stats
            
            # Step 2: Extract full content
            if self.content_extractor:
                logger.info("Step 2: Extracting full article content...")
                articles = await self.content_extractor.enrich_articles(articles)
                stats["content_extracted"] = sum(1 for a in articles if a.get("content"))
                logger.info(f"Extracted content for {stats['content_extracted']} articles")
            
            # Step 3: Analyze articles (dual sentiment + tickers)
            logger.info("Step 3: Analyzing articles with dual models...")
            analyzed_articles = await self._analyze_articles(articles)
            stats["analyzed"] = len(analyzed_articles)
            logger.info(f"Analyzed {stats['analyzed']} articles")
            
            # Step 4: Write to database
            logger.info("Step 4: Writing to database...")
            write_stats = await self.writer.write_articles(analyzed_articles)
            stats.update(write_stats)
            logger.info(f"Write stats: {write_stats}")
            
            logger.info("Pipeline execution completed successfully")
            
        except Exception as e:
            logger.error(f"Pipeline execution failed: {e}", exc_info=True)
            stats["errors"] += 1
        
        return stats
    
    async def _scrape_articles(self, stats: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Scrape articles from RSS feeds or Google Search.
        
        Args:
            stats: Statistics dictionary to update
            
        Returns:
            List of article dictionaries
        """
        articles = []
        
        # Try RSS first if enabled and available
        if self.config.use_rss_primary and self.rss_scraper:
            logger.info("Step 1: Scraping news from RSS feeds...")
            try:
                articles = await self.rss_scraper.fetch_all_feeds()
                stats["scraped"] = len(articles)
                stats["source"] = "rss"
                logger.info(f"RSS: Scraped {stats['scraped']} articles")
                
                if articles:
                    return articles
                    
            except Exception as e:
                logger.warning(f"RSS scraping failed, falling back to Google: {e}")
        
        # Fallback to Google Search
        logger.info("Step 1: Scraping news with Google Search (fallback)...")
        articles = await self.google_searcher.search_comprehensive(
            enable_market=self.config.enable_market_search,
            enable_macro=self.config.enable_macro_search,
            enable_tickers=self.config.enable_ticker_search,
            top_tickers_count=self.config.top_tickers_count
        )
        stats["scraped"] = len(articles)
        stats["source"] = "google"
        logger.info(f"Google: Scraped {stats['scraped']} articles")
        
        return articles
    
    async def _filter_existing_articles(
        self,
        articles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Filter out articles that already exist in database.
        
        Checks by source_url to avoid re-processing the same news.
        
        Args:
            articles: List of scraped articles
            
        Returns:
            List of new articles not in database
        """
        if not articles:
            return []
        
        try:
            # Get URLs of scraped articles
            urls = [a.get("url") for a in articles if a.get("url")]
            
            if not urls:
                return articles
            
            # Query database for existing URLs (batch check)
            existing_urls = set()
            
            # Check in batches of 50 to avoid query limits
            batch_size = 50
            for i in range(0, len(urls), batch_size):
                batch_urls = urls[i:i + batch_size]
                
                response = self.supabase.table("news")\
                    .select("source_url")\
                    .in_("source_url", batch_urls)\
                    .execute()
                
                if response.data:
                    for row in response.data:
                        if row.get("source_url"):
                            existing_urls.add(row["source_url"])
            
            # Filter out existing articles
            new_articles = [
                a for a in articles 
                if a.get("url") and a.get("url") not in existing_urls
            ]
            
            logger.info(f"Deduplication: {len(existing_urls)} existing, {len(new_articles)} new")
            return new_articles
            
        except Exception as e:
            logger.error(f"Error filtering existing articles: {e}")
            # Return all articles if check fails
            return articles
    
    async def _analyze_articles(
        self,
        articles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Analyze articles with dual sentiment and ticker detection.
        
        Args:
            articles: List of raw article dictionaries
            
        Returns:
            List of analyzed article dictionaries
        """
        analyzed = []
        run_dual = getattr(self.config, 'run_dual_analysis', True)
        
        for article in articles:
            try:
                # Use full content if available, otherwise title + snippet
                text = article.get("content") or ""
                if not text:
                    text = article.get("title", "") + " " + article.get("snippet", "")
                
                if not text.strip():
                    logger.warning(f"No text for article: {article.get('url')}")
                    continue
                
                # Detect language
                is_vietnamese = self._is_vietnamese(text)
                article["language"] = "vi" if is_vietnamese else "en"
                
                # Dual sentiment analysis
                if run_dual:
                    # Run both models
                    article["finbert_sentiment"] = self.finbert.analyze(text)
                    article["phobert_sentiment"] = self.phobert.analyze(text)
                    
                    # Use appropriate model as primary sentiment
                    if is_vietnamese:
                        article["sentiment"] = article["phobert_sentiment"]
                    else:
                        article["sentiment"] = article["finbert_sentiment"]
                else:
                    # Single model based on language
                    if is_vietnamese:
                        article["sentiment"] = self.phobert.analyze(text)
                        article["phobert_sentiment"] = article["sentiment"]
                    else:
                        article["sentiment"] = self.finbert.analyze(text)
                        article["finbert_sentiment"] = article["sentiment"]
                
                # Ticker detection
                tickers = self.ticker_detector.detect_tickers(text)
                article["tickers"] = tickers
                
                # Extract keywords from tickers
                keywords = self._extract_keywords(text, tickers)
                article["keywords"] = keywords
                
                analyzed.append(article)
                
            except Exception as e:
                logger.error(f"Error analyzing article: {e}")
                continue
        
        return analyzed
    
    def _extract_keywords(
        self,
        text: str,
        tickers: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Extract keywords from text and ticker context.
        
        Args:
            text: Article text
            tickers: Detected tickers with context
            
        Returns:
            List of keywords
        """
        keywords = set()
        
        # Keywords from ticker detection
        for t in tickers:
            if isinstance(t, dict):
                context = t.get("context", "")
                if context:
                    for word in context.split():
                        if len(word) > 3:
                            keywords.add(word.lower())
        
        # Common financial keywords in text
        financial_keywords = [
            "vn-index", "tăng", "giảm", "thanh khoản", "khối ngoại",
            "lợi nhuận", "doanh thu", "cổ tức", "lãi suất", "tỷ giá",
            "gdp", "cpi", "chứng khoán", "ngân hàng", "bất động sản"
        ]
        
        text_lower = text.lower()
        for kw in financial_keywords:
            if kw in text_lower:
                keywords.add(kw)
        
        return list(keywords)[:15]  # Limit to 15 keywords
    
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
