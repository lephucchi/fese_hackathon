"""
Query Guard - Security layer for RAG pipeline.

Prevents malicious queries from reaching the pipeline:
- LLM injection attempts
- System probing (asking about model, system)
- Off-topic queries
- Abuse attempts
"""
import re
import logging
from dataclasses import dataclass
from enum import Enum
from typing import List, Optional

logger = logging.getLogger(__name__)


class RiskLevel(Enum):
    """Risk level classification."""
    SAFE = "safe"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class QueryGuardResult:
    """Result from query security check."""
    is_safe: bool
    risk_level: RiskLevel
    reason: str
    blocked_patterns: List[str]
    suggestions: Optional[str] = None
    
    def to_dict(self):
        return {
            "is_safe": self.is_safe,
            "risk_level": self.risk_level.value,
            "reason": self.reason,
            "blocked_patterns": self.blocked_patterns,
            "suggestions": self.suggestions
        }


class QueryGuard:
    """
    Security guard for filtering malicious/inappropriate queries.
    
    Checks for:
    1. LLM injection attempts
    2. System probing
    3. Off-topic queries
    4. Abusive patterns
    """
    
    # LLM Injection Patterns
    LLM_INJECTION_PATTERNS = [
        r"ignore\s+(previous|all|prior)\s+(instructions?|prompts?|rules?)",
        r"forget\s+(everything|all|previous)",
        r"new\s+(instructions?|task|role|system\s+message)",
        r"you\s+are\s+now",
        r"system:\s*",
        r"admin\s+(mode|access|override)",
        r"reveal\s+(your\s+)?(prompt|instructions?|system\s+message)",
        r"show\s+(me\s+)?(your\s+)?(prompt|instructions?|code)",
        r"bypass\s+(security|filter|guard)",
        r"<\|.*?\|>",  # Special tokens
        r"\[INST\]|\[/INST\]",  # Instruction tags
    ]
    
    # System Probing Patterns
    SYSTEM_PROBE_PATTERNS = [
        r"what\s+(is\s+your|are\s+you)\s+(name|model|version)",
        r"who\s+(are\s+you|made\s+you|created\s+you)",
        r"what\s+(can\s+you|model|ai|llm)",
        r"(bạn|bn|b)\s+(là\s+ai|tên\s+gì)",
        r"(ai|model|llm)\s+gì",
        r"(bạn|bn)\s+(có\s+thể|biết|hiểu)\s+gì",
    ]
    
    # Off-topic Patterns (không liên quan tài chính)
    OFF_TOPIC_PATTERNS = [
        r"tell\s+me\s+a\s+(joke|story)",
        r"write\s+me\s+a\s+(poem|song|story)",
        r"how\s+to\s+(cook|bake|make\s+food)",
        r"(weather|thời\s+tiết)\s+(today|hôm\s+nay)",
        r"(movie|film|phim)\s+(recommendation|gợi\s+ý)",
        r"(kể|viết)\s+(chuyện|truyện|thơ)",
        r"nấu\s+ăn",
        r"du\s+lịch",
        r"game\s+gì",
    ]
    
    # Finance Keywords (to validate relevance)
    FINANCE_KEYWORDS = [
        # Vietnamese
        "cổ phiếu", "chứng khoán", "đầu tư", "tài chính", "ngân hàng",
        "lãi suất", "lợi nhuận", "giá", "thị trường", "kinh tế",
        "roi", "roe", "eps", "pe", "pb", "ebitda",
        "vcb", "vnm", "hpg", "vn30", "vnindex",
        "margin", "revenue", "profit", "asset", "equity",
        "quarter", "year", "report", "financial", "statement",
        "buy", "sell", "trade", "invest", "portfolio",
        "vàng", "gold", "forex", "tiền tệ", "tỷ giá",  # Gold, currency
        # English
        "stock", "market", "invest", "finance", "bank",
        "interest", "profit", "price", "economy", "trading",
        "analysis", "valuation", "dividend", "growth",
        
        # Common queries
        "là gì", "nghĩa là", "what is", "how to",
        "phân tích", "dự báo", "forecast", "outlook",
        "tăng", "giảm", "increase", "decrease",
    ]
    
    def __init__(
        self,
        enable_injection_check: bool = True,
        enable_probe_check: bool = True,
        enable_topic_check: bool = True,
        min_finance_score: float = 0.3
    ):
        self.enable_injection_check = enable_injection_check
        self.enable_probe_check = enable_probe_check
        self.enable_topic_check = enable_topic_check
        self.min_finance_score = min_finance_score
        
        logger.info(
            f"QueryGuard initialized: "
            f"injection_check={enable_injection_check}, "
            f"probe_check={enable_probe_check}, "
            f"topic_check={enable_topic_check}, "
            f"min_finance_score={min_finance_score}"
        )
    
    def check(self, query: str) -> QueryGuardResult:
        """
        Check query for security issues.
        
        Uses BLACKLIST approach - only blocks clearly malicious/off-topic queries.
        Does NOT require finance keywords (domain is too broad).
        
        Returns:
            QueryGuardResult with is_safe=True if query is safe
        """
        query_lower = query.lower().strip()
        blocked_patterns = []
        
        # 1. Check LLM Injection (CRITICAL - always check)
        if self.enable_injection_check:
            for pattern in self.LLM_INJECTION_PATTERNS:
                if re.search(pattern, query_lower, re.IGNORECASE):
                    blocked_patterns.append(f"LLM_INJECTION: {pattern[:30]}")
                    logger.warning(f"Blocked LLM injection attempt: {query[:100]}")
                    return QueryGuardResult(
                        is_safe=False,
                        risk_level=RiskLevel.CRITICAL,
                        reason="Potential LLM injection attack detected",
                        blocked_patterns=blocked_patterns,
                        suggestions="Please rephrase your question in a straightforward manner."
                    )
        
        # 2. Check System Probing
        if self.enable_probe_check:
            for pattern in self.SYSTEM_PROBE_PATTERNS:
                if re.search(pattern, query_lower, re.IGNORECASE):
                    blocked_patterns.append(f"SYSTEM_PROBE: {pattern[:30]}")
                    logger.warning(f"Blocked system probe: {query[:100]}")
                    return QueryGuardResult(
                        is_safe=False,
                        risk_level=RiskLevel.HIGH,
                        reason="System information probing not allowed",
                        blocked_patterns=blocked_patterns,
                        suggestions="I'm a financial analysis assistant. Please ask questions about stocks, markets, or finance."
                    )
        
        # 3. Check clearly Off-Topic patterns (cooking, travel, games, etc.)
        if self.enable_topic_check:
            for pattern in self.OFF_TOPIC_PATTERNS:
                if re.search(pattern, query_lower, re.IGNORECASE):
                    blocked_patterns.append(f"OFF_TOPIC: {pattern[:30]}")
                    logger.info(f"Blocked off-topic query: {query[:100]}")
                    return QueryGuardResult(
                        is_safe=False,
                        risk_level=RiskLevel.MEDIUM,
                        reason="Query appears to be off-topic (not related to finance/legal/economic)",
                        blocked_patterns=blocked_patterns,
                        suggestions="Please ask questions related to finance, stocks, law, or economics."
                    )
        
        # Query is safe - no blacklist patterns matched
        # Note: We don't require finance keywords because the domain is very broad
        # (finance + legal + economic covers many topics)
        logger.info(f"Query passed security checks (no blocked patterns found)")
        return QueryGuardResult(
            is_safe=True,
            risk_level=RiskLevel.SAFE,
            reason="Query passed all security checks",
            blocked_patterns=[]
        )
    
    def _calculate_finance_score(self, query: str) -> float:
        """
        Calculate how finance-related the query is.
        
        Returns:
            Score from 0.0 to 1.0
        """
        query_words = set(query.lower().split())
        
        # Count matching finance keywords
        matches = 0
        for keyword in self.FINANCE_KEYWORDS:
            if keyword in query.lower():
                matches += 1
        
        # Normalize score
        max_score = min(len(self.FINANCE_KEYWORDS), 5)  # Cap at 5 matches
        score = min(matches / max_score, 1.0)
        
        # Boost score for short queries with stock codes
        if len(query_words) <= 5:
            # Check for stock patterns: VCB, VNM, VN30, etc.
            stock_pattern = r'\b[A-Z]{3,5}\b'
            if re.search(stock_pattern, query):
                score = max(score, 0.6)
        
        return score


# Singleton instance
_query_guard: Optional[QueryGuard] = None


def get_query_guard(
    enable_injection_check: bool = True,
    enable_probe_check: bool = True,
    enable_topic_check: bool = True,
    min_finance_score: float = 0.3
) -> QueryGuard:
    """Get or create QueryGuard singleton."""
    global _query_guard
    
    if _query_guard is None:
        _query_guard = QueryGuard(
            enable_injection_check=enable_injection_check,
            enable_probe_check=enable_probe_check,
            enable_topic_check=enable_topic_check,
            min_finance_score=min_finance_score
        )
    
    return _query_guard
