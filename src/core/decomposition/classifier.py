"""
Query Complexity Classifier.

Determines if a query needs decomposition using pattern matching.
Follows Single Responsibility Principle - only classifies, doesn't decompose.
"""
import re
from typing import Tuple
from dataclasses import dataclass

from src.config import ClassifierConfig


@dataclass
class ClassificationResult:
    """Result of query classification."""
    is_complex: bool
    reason: str
    complexity_score: float
    
    def __bool__(self) -> bool:
        return self.is_complex


class QueryComplexityClassifier:
    """
    Classify query as simple or complex (needs decomposition).
    
    Uses rule-based pattern matching for fast, deterministic classification.
    This provides a first-pass filter before expensive LLM calls.
    
    Example:
        >>> classifier = QueryComplexityClassifier()
        >>> result = classifier.classify("ROE là gì và VNM có ROE bao nhiêu")
        >>> result.is_complex
        True
    """
    
    def __init__(self, config: ClassifierConfig = None):
        """
        Initialize classifier with config.
        
        Args:
            config: Classification configuration (uses defaults if None)
        """
        self.config = config or ClassifierConfig()
    
    def classify(self, query: str) -> ClassificationResult:
        """
        Classify query complexity.
        
        Args:
            query: User query string
            
        Returns:
            ClassificationResult with is_complex, reason, and score
        """
        query_lower = query.lower().strip()
        score = 0.0
        
        # Check composite patterns (highest priority)
        for pattern in self.config.composite_patterns:
            if re.search(pattern, query_lower):
                score += 0.3
                return ClassificationResult(
                    is_complex=True,
                    reason=f"composite_pattern: {pattern}",
                    complexity_score=min(score + 0.3, 1.0)
                )
        
        # Check multi-intent patterns
        for pattern in self.config.multi_intent_patterns:
            if re.search(pattern, query_lower):
                score += 0.4
                return ClassificationResult(
                    is_complex=True,
                    reason=f"multi_intent: {pattern}",
                    complexity_score=min(score + 0.2, 1.0)
                )
        
        # Check word count
        word_count = len(query.split())
        if word_count >= self.config.min_words_for_complex:
            score += 0.2
            return ClassificationResult(
                is_complex=True,
                reason=f"long_query: {word_count} words",
                complexity_score=min(score + 0.2, 1.0)
            )
        
        # Check clause count
        clauses = re.split(r'[,;]', query)
        clause_count = len([c for c in clauses if len(c.strip()) > 5])
        if clause_count >= self.config.min_clauses_for_complex:
            score += 0.15
            return ClassificationResult(
                is_complex=True,
                reason=f"multi_clause: {clause_count} clauses",
                complexity_score=min(score + 0.15, 1.0)
            )
        
        return ClassificationResult(
            is_complex=False,
            reason="simple_query",
            complexity_score=score
        )
    
    # Backwards compatibility
    def is_complex(self, query: str) -> Tuple[bool, str]:
        """
        Legacy method for backwards compatibility.
        
        Args:
            query: User query string
            
        Returns:
            Tuple of (is_complex, reason)
        """
        result = self.classify(query)
        return result.is_complex, result.reason
