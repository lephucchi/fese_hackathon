"""
Fallback Decision Logic.

Determines whether external web search should be triggered
based on retrieval results and query characteristics.

Follows Single Responsibility Principle - only handles decision logic.
"""
import logging
from dataclasses import dataclass
from enum import Enum
from typing import List, Dict, Any, Optional

from src.config.fallback_config import get_fallback_config, FallbackConfig

logger = logging.getLogger(__name__)


class FallbackReason(str, Enum):
    """Enumeration of reasons for fallback decisions."""
    NO_DOCS_RETRIEVED = "NO_DOCS_RETRIEVED"
    LOW_RELEVANCE_SCORE = "LOW_RELEVANCE_SCORE"
    TEMPORAL_QUERY = "TEMPORAL_QUERY"
    SUFFICIENT_COVERAGE = "SUFFICIENT_COVERAGE"
    FALLBACK_DISABLED = "FALLBACK_DISABLED"
    TRY_NEWS_FIRST = "TRY_NEWS_FIRST"  # Try news DB before Google
    LLM_REFUSAL = "LLM_REFUSAL"  # LLM couldn't answer from context
    LOW_CONFIDENCE_GENERATION = "LOW_CONFIDENCE_GENERATION"  # Answer seems uncertain


# Keywords that ALWAYS require real-time data (today, right now)
STRONG_TEMPORAL_KEYWORDS = (
    "hôm nay", "hôm qua", "sáng nay", "chiều nay", "tối nay",
    "lúc này", "bây giờ", "ngay bây giờ", "hiện tại", "hiện nay",
    "today", "yesterday", "right now", "currently", "now",
)

# Keywords that suggest recent data (this week, latest)
WEAK_TEMPORAL_KEYWORDS = (
    "tuần này", "tháng này", "năm nay", "mới nhất", "gần đây",
    "vừa rồi", "vừa qua", "latest", "recent", "recently",
    "this week", "this month", "this year",
)


@dataclass
class FallbackDecision:
    """
    Result of fallback decision analysis.
    
    Attributes:
        should_fallback: Whether to trigger external search
        reason: Why this decision was made
        max_similarity_score: Highest similarity score from retrieval
        doc_count: Number of documents retrieved
        details: Additional context about the decision
    """
    should_fallback: bool
    reason: FallbackReason
    max_similarity_score: float
    doc_count: int
    details: Optional[str] = None
    fallback_type: str = "GOOGLE"  # "NEWS_DB" or "GOOGLE"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for state storage."""
        return {
            "should_fallback": self.should_fallback,
            "reason": self.reason.value,
            "max_similarity_score": self.max_similarity_score,
            "doc_count": self.doc_count,
            "details": self.details,
            "fallback_type": self.fallback_type,
        }


class FallbackDecider:
    """
    Decides whether external web search is needed.
    
    Analyzes retrieval results and query intent to determine
    if the internal knowledge base has sufficient coverage.
    
    Follows Open/Closed Principle - extend via config, not modification.
    """
    
    def __init__(self, config: Optional[FallbackConfig] = None):
        """
        Initialize the fallback decider.
        
        Args:
            config: Optional custom configuration. Uses default if None.
        """
        self.config = config or get_fallback_config()
    
    def decide(
        self,
        query: str,
        contexts: List[Dict[str, Any]],
        routes: Optional[List[str]] = None,
        generated_answer: Optional[str] = None  # NEW: Check answer quality
    ) -> FallbackDecision:
        """
        Analyze retrieval results and decide if fallback is needed.
        
        Args:
            query: Original user query
            contexts: Retrieved documents with similarity scores
            routes: Routes selected by semantic router
            generated_answer: Generated answer to check for refusals/low confidence
            
        Returns:
            FallbackDecision with analysis results
        """
        # Check if fallback is enabled
        if not self.config.enabled:
            logger.debug("Fallback is disabled via configuration")
            return FallbackDecision(
                should_fallback=False,
                reason=FallbackReason.FALLBACK_DISABLED,
                max_similarity_score=0.0,
                doc_count=len(contexts) if contexts else 0,
                details="Fallback disabled in configuration"
            )
        
        # Extract similarity scores early
        scores = self._extract_scores(contexts) if contexts else []
        max_score = max(scores) if scores else 0.0
        doc_count = len(contexts) if contexts else 0
        
        # NEW PRIORITY 0: Check if LLM refused or generated low-confidence answer
        if generated_answer:
            is_refusal = self._detect_llm_refusal(generated_answer)
            if is_refusal:
                logger.warning(
                    f"LLM refusal detected in generated answer - triggering fallback"
                )
                return FallbackDecision(
                    should_fallback=True,
                    reason=FallbackReason.LLM_REFUSAL,
                    max_similarity_score=max_score,
                    doc_count=doc_count,
                    details="LLM indicated it cannot answer with available context",
                    fallback_type="GOOGLE"
                )
        
        # PRIORITY 1: Strong temporal keywords ALWAYS require real-time data
        # Database cannot have "today's" data, so we must fallback
        strong_temporal = self._has_strong_temporal_keywords(query)
        if strong_temporal:
            matched_keyword = strong_temporal
            logger.info(
                f"Strong temporal keyword '{matched_keyword}' detected - forcing fallback: {query[:50]}..."
            )
            return FallbackDecision(
                should_fallback=True,
                reason=FallbackReason.TEMPORAL_QUERY,
                max_similarity_score=max_score,
                doc_count=doc_count,
                details=f"Query requires real-time data (matched: '{matched_keyword}')"
            )
        
        # PRIORITY 2: No documents retrieved
        if not contexts:
            logger.info(f"No documents retrieved for query: {query[:50]}...")
            return FallbackDecision(
                should_fallback=True,
                reason=FallbackReason.NO_DOCS_RETRIEVED,
                max_similarity_score=0.0,
                doc_count=0,
                details="No documents retrieved from any index"
            )
        
        # PRIORITY 3: Low relevance scores
        if max_score < self.config.relevance_threshold:
            # Check if news wasn't tried yet
            news_tried = routes and "news" in routes
            
            if not news_tried:
                logger.info(
                    f"Low relevance ({max_score:.3f}) - try news first before Google"
                )
                return FallbackDecision(
                    should_fallback=True,
                    reason=FallbackReason.TRY_NEWS_FIRST,
                    max_similarity_score=max_score,
                    doc_count=doc_count,
                    details=f"Low relevance - will try news index first",
                    fallback_type="NEWS_DB"
                )
            
            logger.info(
                f"Low relevance score ({max_score:.3f} < {self.config.relevance_threshold}) "
                f"for query: {query[:50]}... - falling back to Google"
            )
            return FallbackDecision(
                should_fallback=True,
                reason=FallbackReason.LOW_RELEVANCE_SCORE,
                max_similarity_score=max_score,
                doc_count=doc_count,
                details=f"Max score {max_score:.3f} below threshold {self.config.relevance_threshold}",
                fallback_type="GOOGLE"
            )
        
        # PRIORITY 4: Weak temporal keywords with insufficient news coverage
        weak_temporal = self._has_weak_temporal_keywords(query)
        if weak_temporal:
            has_news = self._has_news_context(contexts, routes)
            if not has_news:
                logger.info(f"Temporal query without news coverage: {query[:50]}...")
                return FallbackDecision(
                    should_fallback=True,
                    reason=FallbackReason.TEMPORAL_QUERY,
                    max_similarity_score=max_score,
                    doc_count=doc_count,
                    details=f"Temporal keywords detected ('{weak_temporal}') but no news coverage"
                )
        
        # Case 5: Sufficient coverage
        logger.debug(f"Sufficient coverage for query: {query[:50]}...")
        return FallbackDecision(
            should_fallback=False,
            reason=FallbackReason.SUFFICIENT_COVERAGE,
            max_similarity_score=max_score,
            doc_count=doc_count,
            details=f"Coverage sufficient with {doc_count} docs, max score {max_score:.3f}"
        )
    
    def _extract_scores(self, contexts: List[Dict[str, Any]]) -> List[float]:
        """Extract similarity scores from contexts."""
        scores = []
        for ctx in contexts:
            # Try different keys for similarity score
            score = ctx.get("similarity") or ctx.get("score") or ctx.get("relevance_score") or 0.0
            scores.append(float(score))
        return scores
    
    def _has_strong_temporal_keywords(self, query: str) -> Optional[str]:
        """
        Check for STRONG temporal keywords that require real-time data.
        
        Returns the matched keyword if found, None otherwise.
        """
        query_lower = query.lower()
        for keyword in STRONG_TEMPORAL_KEYWORDS:
            if keyword.lower() in query_lower:
                return keyword
        return None
    
    def _has_weak_temporal_keywords(self, query: str) -> Optional[str]:
        """
        Check for WEAK temporal keywords that suggest recent data.
        
        Returns the matched keyword if found, None otherwise.
        """
        query_lower = query.lower()
        for keyword in WEAK_TEMPORAL_KEYWORDS:
            if keyword.lower() in query_lower:
                return keyword
        return None    
    def _detect_llm_refusal(self, answer: str) -> bool:
        """
        Detect if LLM refused to answer or gave a low-confidence response.
        
        Args:
            answer: Generated answer text
            
        Returns:
            True if refusal/low-confidence detected, False otherwise
        """
        if not answer or len(answer.strip()) < 20:
            return True  # Too short to be a real answer
        
        answer_lower = answer.lower()
        
        # Vietnamese refusal patterns
        refusal_patterns_vn = [
            "không có thông tin",
            "chưa có thông tin",
            "không tìm thấy",
            "chưa tìm thấy",
            "mình không có",
            "mình chưa có",
            "dữ liệu hiện tại mình chưa có",
            "trong dữ liệu hiện tại",
            "rất tiếc",
            "xin lỗi",
            "không thể trả lời",
            "chưa thể trả lời",
        ]
        
        # English refusal patterns
        refusal_patterns_en = [
            "i don't have",
            "i don't know",
            "no information",
            "not available",
            "cannot find",
            "cannot answer",
            "unable to",
            "insufficient data",
            "sorry",
            "apologize",
        ]
        
        all_patterns = refusal_patterns_vn + refusal_patterns_en
        
        # Check if answer contains refusal patterns
        for pattern in all_patterns:
            if pattern in answer_lower:
                logger.debug(f"Refusal pattern detected: '{pattern}'")
                return True
        
        return False    
    def _has_news_context(
        self,
        contexts: List[Dict[str, Any]],
        routes: Optional[List[str]] = None
    ) -> bool:
        """Check if we have news coverage."""
        # Check routes
        if routes and "news" in routes:
            # Check if any context is from news index
            for ctx in contexts:
                metadata = ctx.get("metadata", {})
                source = metadata.get("source", "") or metadata.get("index", "")
                if "news" in source.lower():
                    return True
        return False
