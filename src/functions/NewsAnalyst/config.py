"""
Configuration for NewsAnalyst Engine.

Environment variables required:
    - GOOGLE_CUSTOM_SEARCH_API_KEY: Google Custom Search API key
    - GOOGLE_CUSTOM_SEARCH_ENGINE_ID: Search engine ID
    - SUPABASE_URL: Supabase project URL
    - SUPABASE_SERVICE_ROLE_KEY: Supabase service role key
"""
import os
from dataclasses import dataclass, field
from typing import List, Optional
from dotenv import load_dotenv

load_dotenv()


@dataclass
class NewsAnalystConfig:
    """Configuration for NewsAnalyst Engine."""
    
    # Google Custom Search API
    google_api_key: str = field(default_factory=lambda: os.getenv("GOOGLE_CUSTOM_SEARCH_API_KEY", ""))
    google_search_engine_id: str = field(default_factory=lambda: os.getenv("GOOGLE_CUSTOM_SEARCH_ENGINE_ID", ""))
    
    # Supabase
    supabase_url: str = field(default_factory=lambda: os.getenv("SUPABASE_URL", ""))
    supabase_key: str = field(default_factory=lambda: os.getenv("SUPABASE_SERVICE_ROLE_KEY", ""))
    
    # News Sources (Vietnamese financial news sites)
    news_sources: List[str] = field(default_factory=lambda: [
        "cafef.vn",
        "vnexpress.net/kinh-doanh",
        "vietstock.vn",
        "ndh.vn",
        "tinnhanhchungkhoan.vn"
    ])
    
    # Scraping Configuration
    max_results_per_source: int = 10
    scrape_interval_hours: int = 4
    request_timeout: int = 30
    retry_attempts: int = 3
    
    # Sentiment Analysis Models
    finbert_model: str = "ProsusAI/finbert"  # For English
    phobert_model: str = "vinai/phobert-base-v2"  # For Vietnamese
    sentiment_batch_size: int = 8
    
    # Database Configuration
    batch_insert_size: int = 50
    enable_deduplication: bool = True
    
    # Scheduler Configuration
    scheduler_timezone: str = "Asia/Ho_Chi_Minh"
    enable_scheduler: bool = True
    
    # Logging
    log_level: str = "INFO"
    log_file: str = "logs/news_analyst.log"
    
    # Ticker Detection
    ticker_min_confidence: float = 0.7
    
    # Comprehensive Search Configuration
    enable_market_search: bool = True    # Search for market news (VN-Index)
    enable_macro_search: bool = True     # Search for macro news (GDP, CPI, interest)
    enable_ticker_search: bool = True    # Search for specific tickers
    top_tickers_count: int = 10          # Number of top priority tickers to search
    
    # RSS Feed Configuration (Primary scraping method)
    use_rss_primary: bool = True         # Use RSS feeds as primary, Google as fallback
    rss_feeds: dict = field(default_factory=lambda: {
        "vnexpress_chungkhoan": "https://vnexpress.net/rss/kinh-doanh/chung-khoan.rss",
        "vnexpress_kinhdoanh": "https://vnexpress.net/rss/kinh-doanh.rss",
        "cafef_chungkhoan": "https://cafef.vn/rss/chung-khoan.rss",
        "vtv_kinhte": "https://vtv.vn/rss/kinh-te.rss",
        "vietnamnews_economy": "https://vietnamnews.vn/rss/economy.rss",
    })
    rss_lookback_hours: int = 24         # Only fetch articles from last N hours
    
    # Content Extraction
    max_content_length: int = 10000      # Max characters to extract per article
    extraction_timeout: int = 30         # Timeout for content extraction (seconds)
    
    # Dual Sentiment Analysis
    run_dual_analysis: bool = True       # Run both FinBERT and PhoBERT
    
    def validate(self) -> bool:
        """
        Validate configuration.
        
        Returns:
            bool: True if valid, raises ValueError if invalid
        """
        required = [
            ("google_api_key", self.google_api_key),
            ("google_search_engine_id", self.google_search_engine_id),
            ("supabase_url", self.supabase_url),
            ("supabase_key", self.supabase_key),
        ]
        
        missing = [name for name, value in required if not value]
        
        if missing:
            raise ValueError(
                f"Missing required configuration: {', '.join(missing)}. "
                f"Please set environment variables."
            )
        
        return True


# Global config instance
config = NewsAnalystConfig()
