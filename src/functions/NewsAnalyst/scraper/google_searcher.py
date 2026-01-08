"""
Google Custom Search scraper for Vietnamese financial news.

Uses Google Custom Search API to retrieve news articles from specified sources.
Supports comprehensive search with categories, ticker priority, and relevance scoring.
"""
import logging
from typing import List, Dict, Any, Optional, Set
from datetime import datetime, timedelta
import asyncio
import httpx
from supabase import Client

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


# Search categories for comprehensive news coverage
SEARCH_CATEGORIES = {
    "market": [
        "VN-Index hôm nay",
        "thị trường chứng khoán Việt Nam",
        "thanh khoản thị trường chứng khoán",
        "khối ngoại mua bán ròng",
    ],
    "macro": [
        "lãi suất ngân hàng nhà nước",
        "tỷ giá USD VND hôm nay",
        "giá vàng SJC hôm nay",
        "CPI lạm phát Việt Nam",
        "GDP kinh tế Việt Nam",
        "FED lãi suất",
    ],
}

# Priority order for categories (higher = more priority)
# Based on database 'categories' column: VN30, VN100, VNALL, UPCOM
CATEGORY_PRIORITY = {
    "VN30": 100,
    "VN100": 80,
    "VNALL": 60,   # All stocks on HOSE
    "UPCOM": 20,
}


class GoogleNewsSearcher:
    """
    Google Custom Search API wrapper for financial news.
    
    Searches specified Vietnamese news sites for financial content
    using Google Custom Search API.
    """
    
    def __init__(self, config: NewsAnalystConfig, supabase: Optional[Client] = None):
        """
        Initialize searcher.
        
        Args:
            config: NewsAnalystConfig instance
            supabase: Optional Supabase client for loading top tickers
        """
        self.config = config
        self.api_key = config.google_api_key
        self.search_engine_id = config.google_search_engine_id
        self.base_url = "https://www.googleapis.com/customsearch/v1"
        self.supabase = supabase
        
        # Cache for top tickers by priority
        self._top_tickers_cache: List[Dict[str, Any]] = []
        
        logger.info("GoogleNewsSearcher initialized")
    
    async def search_news(
        self,
        query: str = "chứng khoán",
        num_results: int = 10,
        date_restrict: str = "d1"  # Last 1 day
    ) -> List[Dict[str, Any]]:
        """
        Search for news articles.
        
        Args:
            query: Search query (default: stock market related)
            num_results: Number of results to retrieve
            date_restrict: Date restriction (d1=1day, d7=7days)
            
        Returns:
            List of article dictionaries with title, link, snippet, date
        """
        async with httpx.AsyncClient(timeout=self.config.request_timeout) as client:
            params = {
                "key": self.api_key,
                "cx": self.search_engine_id,
                "q": query,
                "num": min(num_results, 10),  # Google API max is 10
                "dateRestrict": date_restrict,
                "lr": "lang_vi",  # Vietnamese language
                "sort": "date"  # Sort by date
            }
            
            try:
                response = await client.get(self.base_url, params=params)
                response.raise_for_status()
                
                data = response.json()
                items = data.get("items", [])
                
                articles = []
                for item in items:
                    article = self._parse_search_item(item)
                    if article:
                        articles.append(article)
                
                logger.info(f"Found {len(articles)} articles for query: {query}")
                return articles
                
            except Exception as e:
                logger.error(f"Error searching news: {e}")
                return []
    
    async def search_multiple_sources(
        self,
        sources: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search news from multiple sources concurrently.
        
        Args:
            sources: List of news site domains (e.g., ['cafef.vn'])
            
        Returns:
            Combined list of articles from all sources
        """
        if sources is None:
            sources = self.config.news_sources
        
        tasks = []
        for source in sources:
            query = f"site:{source} chứng khoán OR cổ phiếu"
            task = self.search_news(
                query=query,
                num_results=self.config.max_results_per_source
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        all_articles = []
        for result in results:
            if isinstance(result, list):
                all_articles.extend(result)
            else:
                logger.error(f"Error in search task: {result}")
        
        logger.info(f"Total articles found: {len(all_articles)}")
        return all_articles
    
    def _parse_search_item(self, item: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Parse Google Search API result item.
        
        Args:
            item: Search result item from API
            
        Returns:
            Parsed article dictionary or None if invalid
        """
        try:
            # Extract metadata
            pagemap = item.get("pagemap", {})
            metatags = pagemap.get("metatags", [{}])[0]
            
            # Extract full title - prefer metatags over Google's truncated title
            full_title = self._extract_full_title(item, metatags)
            
            article = {
                "title": full_title,
                "url": item.get("link", ""),
                "snippet": item.get("snippet", ""),
                "source": self._extract_domain(item.get("link", "")),
                "published_at": self._extract_date(metatags),
                "raw_data": item  # Keep for debugging
            }
            
            # Validate required fields
            if not article["title"] or not article["url"]:
                return None
            
            return article
            
        except Exception as e:
            logger.error(f"Error parsing search item: {e}")
            return None
    
    def _extract_full_title(self, item: Dict[str, Any], metatags: Dict[str, Any]) -> str:
        """
        Extract full title from multiple sources, preferring metatags.
        
        Priority:
        1. og:title (OpenGraph - usually full title)
        2. twitter:title
        3. article:title
        4. title from metatags
        5. Google's default title (may be truncated)
        
        Args:
            item: Search result item
            metatags: Metadata from pagemap
            
        Returns:
            Full title string
        """
        # List of metatag fields to check (in order of preference)
        title_fields = [
            "og:title",
            "twitter:title", 
            "article:title",
            "title",
            "dc.title",
        ]
        
        for field in title_fields:
            if field in metatags and metatags[field]:
                title = metatags[field].strip()
                if len(title) > 5:  # Ensure it's a valid title
                    logger.debug(f"Using title from metatag '{field}': {title[:50]}...")
                    return title
        
        # Fallback to Google's title
        return item.get("title", "")
    
    @staticmethod
    def _extract_domain(url: str) -> str:
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            return parsed.netloc.replace("www.", "")
        except Exception:
            return "unknown"
    
    @staticmethod
    def _extract_date(metatags: Dict[str, Any]) -> Optional[str]:
        """
        Extract publication date from metatags.
        
        Args:
            metatags: Metadata from pagemap
            
        Returns:
            ISO format date string or None
        """
        date_fields = [
            "article:published_time",
            "datePublished",
            "publishdate",
            "date"
        ]
        
        for field in date_fields:
            if field in metatags:
                return metatags[field]
        
        # Default to current time if not found
        return datetime.now().isoformat()
    
    def _load_top_tickers(self, limit: int = 20) -> List[Dict[str, Any]]:
        """
        Load top tickers from database ordered by category priority.
        
        Priority based on 'categories' column: VN30 > VN100 > VNALL > UPCOM
        
        Args:
            limit: Maximum number of tickers to load
            
        Returns:
            List of ticker dictionaries with ticker and categories
        """
        if self._top_tickers_cache:
            return self._top_tickers_cache[:limit]
        
        if not self.supabase:
            logger.warning("No Supabase client, cannot load top tickers")
            return []
        
        try:
            response = self.supabase.table("market_data").select(
                "ticker, categories, company_name"
            ).execute()
            
            if not response.data:
                logger.warning("No tickers found in market_data")
                return []
            
            # Calculate priority for each ticker based on categories
            for ticker_data in response.data:
                ticker_data["priority"] = self._get_category_priority(
                    ticker_data.get("categories", "")
                )
            
            # Sort by priority (highest first)
            sorted_tickers = sorted(
                response.data,
                key=lambda x: x.get("priority", 0),
                reverse=True
            )
            
            self._top_tickers_cache = sorted_tickers
            logger.info(f"Loaded {len(sorted_tickers)} tickers, returning top {limit}")
            
            return sorted_tickers[:limit]
            
        except Exception as e:
            logger.error(f"Error loading top tickers: {e}")
            return []
    
    def _get_category_priority(self, categories: str) -> int:
        """
        Get priority score from categories string.
        
        Categories can be comma-separated like 'VN30, VN100'.
        Returns the highest priority among all categories.
        
        Args:
            categories: Comma-separated category string from database
            
        Returns:
            Highest priority score
        """
        if not categories:
            return 0
        
        # Split by comma and check each category
        category_list = [c.strip().upper() for c in categories.split(",")]
        
        # Return the highest priority found
        max_priority = 0
        for cat in category_list:
            priority = CATEGORY_PRIORITY.get(cat, 0)
            if priority > max_priority:
                max_priority = priority
        
        return max_priority
    
    async def search_by_category(
        self,
        category: str,
        num_results_per_query: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Search news by category (market, macro).
        
        Args:
            category: Category name from SEARCH_CATEGORIES
            num_results_per_query: Results per query
            
        Returns:
            List of articles from category searches
        """
        queries = SEARCH_CATEGORIES.get(category, [])
        if not queries:
            logger.warning(f"Unknown category: {category}")
            return []
        
        tasks = []
        for query in queries:
            task = self.search_news(
                query=query,
                num_results=num_results_per_query,
                date_restrict="d1"
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        articles = []
        for result in results:
            if isinstance(result, list):
                for article in result:
                    article["category"] = category
                    articles.append(article)
            else:
                logger.error(f"Error in category search: {result}")
        
        logger.info(f"Category '{category}': found {len(articles)} articles")
        return articles
    
    async def search_top_tickers(
        self,
        top_n: int = 10,
        num_results_per_ticker: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Search news for top priority tickers.
        
        Tickers are prioritized by categories: VN30 > VN100 > VNALL > UPCOM
        
        Args:
            top_n: Number of top tickers to search
            num_results_per_ticker: Results per ticker
            
        Returns:
            List of articles about specific tickers
        """
        top_tickers = self._load_top_tickers(limit=top_n)
        
        if not top_tickers:
            logger.warning("No top tickers available for search")
            return []
        
        tasks = []
        ticker_info = {}
        
        for ticker_data in top_tickers:
            ticker = ticker_data.get("ticker", "")
            categories = ticker_data.get("categories", "")
            company_name = ticker_data.get("company_name", "")
            priority = ticker_data.get("priority", 0)
            
            if not ticker:
                continue
            
            # Store ticker info for later
            ticker_info[ticker] = {
                "categories": categories,
                "priority": priority
            }
            
            # Build search query with ticker and company name
            query = f"cổ phiếu {ticker}"
            if company_name and len(company_name) > 5:
                # Add company name for better results
                query = f"{ticker} {company_name[:30]}"
            
            task = self.search_news(
                query=query,
                num_results=num_results_per_ticker,
                date_restrict="d1"
            )
            tasks.append((ticker, task))
        
        # Execute searches concurrently
        results = await asyncio.gather(
            *[t[1] for t in tasks],
            return_exceptions=True
        )
        
        articles = []
        for i, result in enumerate(results):
            ticker = tasks[i][0]
            if isinstance(result, list):
                for article in result:
                    article["category"] = "stock"
                    article["searched_ticker"] = ticker
                    article["ticker_priority"] = ticker_info.get(ticker, {}).get("priority", 0)
                    articles.append(article)
            else:
                logger.error(f"Error searching ticker {ticker}: {result}")
        
        # Sort by ticker priority
        articles.sort(key=lambda x: x.get("ticker_priority", 0), reverse=True)
        
        logger.info(f"Ticker search: found {len(articles)} articles for {len(top_tickers)} tickers")
        return articles
    
    async def search_comprehensive(
        self,
        enable_market: bool = True,
        enable_macro: bool = True,
        enable_tickers: bool = True,
        top_tickers_count: int = 10,
        sources: Optional[List[str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Comprehensive search combining all categories.
        
        Searches for:
        1. Market news (VN-Index, market trends)
        2. Macro news (interest rates, GDP, CPI)
        3. Top tickers news (prioritized by VN30 > VN100 > HOSE > HNX > UPCOM)
        4. General stock news from sources
        
        Args:
            enable_market: Include market category search
            enable_macro: Include macro category search
            enable_tickers: Include ticker-specific search
            top_tickers_count: Number of top tickers to search
            sources: Optional list of news sources
            
        Returns:
            Deduplicated list of articles with relevance scores
        """
        logger.info("Starting comprehensive search...")
        
        all_articles = []
        tasks = []
        
        # 1. Market category search
        if enable_market:
            tasks.append(("market", self.search_by_category("market")))
        
        # 2. Macro category search
        if enable_macro:
            tasks.append(("macro", self.search_by_category("macro")))
        
        # 3. Top tickers search
        if enable_tickers and self.supabase:
            tasks.append(("tickers", self.search_top_tickers(top_n=top_tickers_count)))
        
        # 4. General source-based search (existing method)
        tasks.append(("sources", self.search_multiple_sources(sources)))
        
        # Execute all searches concurrently
        results = await asyncio.gather(
            *[t[1] for t in tasks],
            return_exceptions=True
        )
        
        # Collect results
        for i, result in enumerate(results):
            category = tasks[i][0]
            if isinstance(result, list):
                all_articles.extend(result)
                logger.info(f"Search '{category}': {len(result)} articles")
            else:
                logger.error(f"Error in '{category}' search: {result}")
        
        # Deduplicate by URL
        unique_articles = self._deduplicate_articles(all_articles)
        
        # Score relevance
        scored_articles = [
            self._score_relevance(article) for article in unique_articles
        ]
        
        # Sort by relevance score
        scored_articles.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
        
        logger.info(f"Comprehensive search completed: {len(scored_articles)} unique articles "
                   f"(from {len(all_articles)} total)")
        
        return scored_articles
    
    def _deduplicate_articles(
        self,
        articles: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Remove duplicate articles by URL.
        
        Args:
            articles: List of articles (may contain duplicates)
            
        Returns:
            Deduplicated list, keeping first occurrence
        """
        seen_urls: Set[str] = set()
        unique = []
        
        for article in articles:
            url = article.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique.append(article)
        
        return unique
    
    def _score_relevance(self, article: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate relevance score for an article.
        
        Scoring factors:
        - Category priority (stock > market > macro > general)
        - Ticker priority (VN30 > VN100 > ... > UPCOM)
        - Keywords in title
        
        Args:
            article: Article dictionary
            
        Returns:
            Article with 'relevance_score' added
        """
        score = 0.0
        
        # Category score
        category = article.get("category", "")
        category_scores = {
            "stock": 30,
            "market": 25,
            "macro": 20,
        }
        score += category_scores.get(category, 10)
        
        # Ticker priority score (0-100)
        ticker_priority = article.get("ticker_priority", 0)
        score += ticker_priority * 0.5  # Max 50 points
        
        # Keyword boost
        title = article.get("title", "").lower()
        important_keywords = [
            "kết quả kinh doanh", "lợi nhuận", "doanh thu",
            "cổ tức", "tăng vốn", "phát hành",
            "thoái vốn", "mua lại", "sáp nhập",
            "vn-index", "thanh khoản", "khối ngoại"
        ]
        
        for keyword in important_keywords:
            if keyword in title:
                score += 5
        
        article["relevance_score"] = min(score, 100)  # Cap at 100
        return article

