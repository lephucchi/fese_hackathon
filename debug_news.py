"""Full pipeline debug script."""
import asyncio
import logging

# Set up detailed logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from src.functions.NewsAnalyst.config import NewsAnalystConfig
from src.functions.NewsAnalyst.scraper import RSSFeedScraper, ArticleContentExtractor
from src.functions.NewsAnalyst.analyzer import TickerDetector
from src.functions.NewsAnalyst.writer import NewsWriter
from supabase import create_client

async def test_pipeline():
    print("=" * 70)
    print("FULL PIPELINE DEBUG TEST")
    print("=" * 70)
    
    config = NewsAnalystConfig()
    config.validate()
    
    supabase = create_client(config.supabase_url, config.supabase_key)
    
    # Step 1: RSS Scraping
    print("\n[1] RSS SCRAPING")
    print("-" * 50)
    scraper = RSSFeedScraper(config)
    articles = await scraper.fetch_all_feeds()
    print(f"Fetched: {len(articles)} articles")
    
    # Take only 2 articles for testing
    test_articles = articles[:2]
    
    # Step 2: Content Extraction
    print("\n[2] CONTENT EXTRACTION")
    print("-" * 50)
    extractor = ArticleContentExtractor(config)
    test_articles = await extractor.enrich_articles(test_articles)
    
    for i, art in enumerate(test_articles):
        content = art.get('content', '')
        print(f"Article {i+1}: content_length={len(content) if content else 0}")
    
    # Step 3: Ticker Detection
    print("\n[3] TICKER DETECTION")
    print("-" * 50)
    detector = TickerDetector(config, supabase)
    
    for i, art in enumerate(test_articles):
        text = art.get('content') or art.get('title', '')
        tickers = detector.detect_tickers(text)
        art['tickers'] = tickers
        
        print(f"Article {i+1}: detected {len(tickers)} tickers")
        for t in tickers:
            print(f"  - {t['ticker']} ({t['type']}, confidence={t['confidence']:.2f})")
    
    # Step 4: Test Writer
    print("\n[4] WRITER TEST (checking validation)")
    print("-" * 50)
    writer = NewsWriter(config, supabase)
    
    for i, art in enumerate(test_articles):
        tickers_data = art.get('tickers', [])
        
        # Extract ticker list
        ticker_list = writer._extract_ticker_list(tickers_data)
        ticker_text = writer._format_tickers(tickers_data)
        
        print(f"Article {i+1}:")
        print(f"  ticker_list (for analyst): {ticker_list}")
        print(f"  ticker_text (for Ticker column): {ticker_text}")
        
        # Test validation
        if ticker_list:
            valid = await writer._validate_tickers_in_market_data(ticker_list)
            print(f"  valid_in_market_data: {valid}")
    
    print("\n" + "=" * 70)
    print("DEBUG TEST COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    asyncio.run(test_pipeline())
