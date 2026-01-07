"""
Ticker symbol detector for Vietnamese stock market.

Detects ticker symbols (VNM, HPG, etc.) in news articles and maps to stocks.
"""
import logging
import re
from typing import List, Set, Dict, Any
from supabase import Client

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


class TickerDetector:
    """
    Detect and extract Vietnamese stock ticker symbols from text.
    
    Uses pattern matching and database lookup to identify tickers.
    """
    
    def __init__(self, config: NewsAnalystConfig, supabase: Client):
        """
        Initialize ticker detector.
        
        Args:
            config: NewsAnalystConfig instance
            supabase: Supabase client for ticker lookup
        """
        self.config = config
        self.supabase = supabase
        self.known_tickers: Set[str] = set()
        
        # Load tickers from database
        self._load_tickers()
        
        logger.info(f"TickerDetector initialized with {len(self.known_tickers)} tickers")
    
    def _load_tickers(self):
        """Load ticker symbols from market_data table."""
        try:
            response = self.supabase.table("market_data").select("ticker").execute()
            
            if response.data:
                self.known_tickers = {row["ticker"] for row in response.data}
                logger.info(f"Loaded {len(self.known_tickers)} tickers from database")
            else:
                logger.warning("No tickers found in market_data table")
                
        except Exception as e:
            logger.error(f"Error loading tickers: {e}")
            # Fallback to common tickers
            self.known_tickers = {
                "VNM", "HPG", "VCB", "VHM", "VIC", "TCB", "MSN", 
                "MBB", "VJC", "GAS", "PLX", "VRE", "SAB", "NVL"
            }
    
    def detect_tickers(self, text: str) -> List[Dict[str, Any]]:
        """
        Detect ticker symbols in text.
        
        Args:
            text: Text to analyze
            
        Returns:
            List of detected tickers with confidence scores
        """
        detected = []
        
        # Pattern 1: Explicit ticker mentions (e.g., "VNM", "cổ phiếu HPG")
        pattern = r'\b([A-Z]{3})\b'
        matches = re.findall(pattern, text)
        
        for ticker in matches:
            if ticker in self.known_tickers:
                # Check context for confidence
                confidence = self._calculate_confidence(text, ticker)
                
                if confidence >= self.config.ticker_min_confidence:
                    detected.append({
                        "ticker": ticker,
                        "confidence": confidence,
                        "method": "pattern_match"
                    })
        
        # Pattern 2: Company name mentions
        # TODO: Add company name -> ticker mapping
        
        # Deduplicate
        seen = set()
        unique_detected = []
        for item in detected:
            if item["ticker"] not in seen:
                seen.add(item["ticker"])
                unique_detected.append(item)
        
        logger.debug(f"Detected {len(unique_detected)} tickers in text")
        return unique_detected
    
    def _calculate_confidence(self, text: str, ticker: str) -> float:
        """
        Calculate confidence score for ticker detection.
        
        Args:
            text: Original text
            ticker: Detected ticker
            
        Returns:
            Confidence score (0.0 to 1.0)
        """
        confidence = 0.7  # Base confidence
        
        # Boost confidence if ticker appears with context keywords
        context_keywords = [
            "cổ phiếu", "mã", "chứng khoán", "ticker",
            "công ty", "doanh nghiệp", "niêm yết"
        ]
        
        text_lower = text.lower()
        
        # Check if ticker appears near context keywords
        for keyword in context_keywords:
            if keyword in text_lower:
                # Check proximity (within 50 characters)
                ticker_pos = text.find(ticker)
                keyword_pos = text_lower.find(keyword)
                
                if ticker_pos >= 0 and keyword_pos >= 0:
                    distance = abs(ticker_pos - keyword_pos)
                    if distance < 50:
                        confidence = min(1.0, confidence + 0.2)
                        break
        
        # Reduce confidence if ticker appears only once
        if text.count(ticker) == 1:
            confidence *= 0.9
        
        return confidence
    
    def get_ticker_info(self, ticker: str) -> Dict[str, Any]:
        """
        Get ticker information from database.
        
        Args:
            ticker: Ticker symbol
            
        Returns:
            Dictionary with ticker info or None
        """
        try:
            response = self.supabase.table("market_data")\
                .select("*")\
                .eq("ticker", ticker)\
                .execute()
            
            if response.data:
                return response.data[0]
            
        except Exception as e:
            logger.error(f"Error fetching ticker info for {ticker}: {e}")
        
        return None
