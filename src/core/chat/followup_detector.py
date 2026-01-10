"""
Follow-up Query Detector - Classifies query type for cache optimization.

Determines if a query can be answered from cached facts or needs pipeline.
"""
import logging
from enum import Enum
from typing import List, Dict, Optional
import re

logger = logging.getLogger(__name__)


class QueryType(Enum):
    """Query classification for cache decision."""
    CACHE_HIT = "cache_hit"           # Can answer from cached facts
    PARTIAL_HIT = "partial_hit"       # Some cached + some new entities
    CACHE_MISS = "cache_miss"         # Completely new topic


class FollowUpDetector:
    """
    Lightweight detector for follow-up queries.
    
    Uses pattern matching + entity detection for fast classification.
    Avoids LLM call for speed.
    """
    
    # Vietnamese follow-up patterns
    FOLLOWUP_PATTERNS = [
        r'\b(này|đó|trên|kia)\b',           # Demonstratives: này, đó
        r'\b(nó|họ|chúng)\b',               # Pronouns
        r'\b(2|hai|3|ba|cả\s*hai)\b.*\b(cổ phiếu|mã|công ty)\b',  # "2 cổ phiếu này"
        r'^(còn|thế còn|vậy|vậy còn)',      # "còn X thì sao"
        r'\b(so sánh|khác gì|giống|hơn|kém)\b',  # Comparison
        r'\b(tiếp|thêm|chi tiết|cụ thể)\b', # More details
    ]
    
    # Stock ticker pattern (VIC, VCB, VNM, etc.)
    TICKER_PATTERN = r'\b([A-Z]{2,4})\b'
    
    def __init__(self):
        """Initialize detector with compiled patterns."""
        self.followup_patterns = [re.compile(p, re.IGNORECASE) for p in self.FOLLOWUP_PATTERNS]
        self.ticker_pattern = re.compile(self.TICKER_PATTERN)
    
    def extract_entities(self, text: str) -> List[str]:
        """Extract stock tickers and company names from text."""
        tickers = self.ticker_pattern.findall(text)
        # Filter out common words that look like tickers
        excluded = {'ROE', 'ROA', 'EPS', 'P/E', 'P/B', 'GDP', 'USD', 'VND', 'THE', 'FOR', 'AND'}
        return [t for t in tickers if t.upper() not in excluded]
    
    def is_followup_query(self, query: str) -> bool:
        """Check if query contains follow-up language patterns."""
        for pattern in self.followup_patterns:
            if pattern.search(query):
                return True
        return False
    
    # Keywords that indicate specific info needs (not general follow-up)
    SPECIFIC_INFO_KEYWORDS = [
        'doanh thu', 'lợi nhuận', 'giá', 'cổ tức', 'p/e', 'eps', 
        'roe', 'roa', 'market cap', 'vốn hóa', 'tài sản', 'nợ',
        'năm 2024', 'năm 2023', 'quý', 'tháng', 'hôm nay', 'mới nhất',
        'biến động', 'tăng', 'giảm', 'so với', 'bao nhiêu'
    ]
    
    def classify(
        self,
        query: str,
        cached_entities: List[str],
        chat_history: Optional[List[Dict]] = None,
        cached_facts: Optional[List[Dict]] = None
    ) -> QueryType:
        """
        Classify query for cache decision.
        
        Args:
            query: New user query
            cached_entities: List of entities already cached (e.g., ['VIC', 'VCB'])
            chat_history: Recent chat messages
            cached_facts: List of cached facts to check relevance
            
        Returns:
            QueryType indicating cache strategy
        """
        # Extract entities from new query
        query_entities = self.extract_entities(query)
        query_entities_upper = [e.upper() for e in query_entities]
        cached_upper = [e.upper() for e in cached_entities]
        
        logger.info(f"[FollowUp] Query entities: {query_entities}, Cached: {cached_entities}")
        
        # Check for follow-up language
        is_followup = self.is_followup_query(query)
        
        # If no explicit entities but has follow-up language → CACHE_HIT
        if not query_entities and is_followup:
            logger.info(f"[FollowUp] Follow-up pattern detected, no new entities → CACHE_HIT")
            return QueryType.CACHE_HIT
        
        # If all query entities are cached...
        if query_entities and all(e in cached_upper for e in query_entities_upper):
            # NEW: Check if query asks for specific info not in cache
            if cached_facts and self._query_needs_new_info(query, cached_facts):
                logger.info(f"[FollowUp] Entity cached but query needs NEW info → CACHE_MISS")
                return QueryType.CACHE_MISS
            
            logger.info(f"[FollowUp] All entities cached → CACHE_HIT")
            return QueryType.CACHE_HIT
        
        # If some entities cached, some new → PARTIAL_HIT
        if query_entities and any(e in cached_upper for e in query_entities_upper):
            new_entities = [e for e in query_entities_upper if e not in cached_upper]
            logger.info(f"[FollowUp] New entities needed: {new_entities} → PARTIAL_HIT")
            return QueryType.PARTIAL_HIT
        
        # If completely new entities or no cache → CACHE_MISS
        if query_entities and not any(e in cached_upper for e in query_entities_upper):
            logger.info(f"[FollowUp] Completely new entities → CACHE_MISS")
            return QueryType.CACHE_MISS
        
        # Default: no entities detected, run full pipeline
        logger.info(f"[FollowUp] No clear classification → CACHE_MISS")
        return QueryType.CACHE_MISS
    
    def _query_needs_new_info(self, query: str, cached_facts: List[Dict]) -> bool:
        """
        Check if query asks for specific info that isn't in cached facts.
        
        Returns True if query contains specific keywords (doanh thu, giá, etc.)
        that don't appear in any cached fact → needs new retrieval.
        """
        query_lower = query.lower()
        
        # Extract specific info keywords from query
        query_keywords = []
        for kw in self.SPECIFIC_INFO_KEYWORDS:
            if kw in query_lower:
                query_keywords.append(kw)
        
        # No specific keywords → general follow-up, cache is fine
        if not query_keywords:
            return False
        
        # Check if any cached fact contains these keywords
        facts_text = " ".join([
            f.get("statement", f.get("content", "")).lower() 
            for f in cached_facts
        ])
        
        # If less than half of query keywords appear in facts → need new info
        found_count = sum(1 for kw in query_keywords if kw in facts_text)
        coverage = found_count / len(query_keywords) if query_keywords else 1.0
        
        logger.info(f"[FollowUp] Query keywords: {query_keywords}, Coverage: {coverage:.0%}")
        
        if coverage < 0.5:
            logger.info(f"[FollowUp] Low fact coverage ({coverage:.0%}) → needs new retrieval")
            return True
        
        return False


# Singleton
_detector: Optional[FollowUpDetector] = None


def get_followup_detector() -> FollowUpDetector:
    """Get or create FollowUpDetector singleton."""
    global _detector
    if _detector is None:
        _detector = FollowUpDetector()
    return _detector
