"""
Result fusion strategies for multi-index retrieval.

Provides methods to merge and rank documents from multiple sources.
Single Responsibility: Only handles fusion, not retrieval.

Updated for Canonical Answer Framework (CAF) - Step 8.
"""
from typing import List, Dict, Tuple
from dataclasses import dataclass
from enum import Enum

from src.config import FusionConfig
from .parallel import RetrievedDocument


class FusionStrategy(Enum):
    """Available fusion strategies."""
    WEIGHTED = "weighted"
    ROUND_ROBIN = "round_robin"
    TOP_K = "top_k"


@dataclass
class FusedContext:
    """
    Fused context ready for generation.
    
    Attributes:
        documents: Ranked list of documents
        formatted_context: Context string for LLM
        source_distribution: Document count per source
        citations: Citation references
    """
    documents: List[RetrievedDocument]
    formatted_context: str
    source_distribution: Dict[str, int]
    citations: List[dict] = None
    
    @property
    def total_docs(self) -> int:
        return len(self.documents)
    
    def to_dict(self) -> dict:
        return {
            "total_docs": self.total_docs,
            "source_distribution": self.source_distribution,
            "formatted_context_preview": self.formatted_context[:500] + "...",
            "citations": self.citations,
        }


class ResultFusion:
    """
    Strategies for fusing results from multiple indices.
    
    Supports:
    - weighted: Apply source-based weights to similarity scores
    - round_robin: Interleave documents from different sources
    - top_k: Simply take top-k by similarity
    - format_by_sub_query: CAF-compatible formatting (NEW)
    
    Example:
        >>> fusion = ResultFusion()
        >>> result = fusion.merge(documents, strategy=FusionStrategy.WEIGHTED)
        >>> print(result.formatted_context)
    """
    
    # Source ordering for round-robin
    SOURCE_ORDER = ["glossary", "legal", "financial", "news"]
    
    def __init__(self, config: FusionConfig = None):
        """
        Initialize with optional config.
        
        Args:
            config: Fusion configuration
        """
        self.config = config or FusionConfig()
    
    def merge(
        self,
        documents: List[RetrievedDocument],
        strategy: FusionStrategy = FusionStrategy.WEIGHTED,
        max_docs: int = None
    ) -> FusedContext:
        """
        Merge and rank documents from multiple indices.
        
        Args:
            documents: Retrieved documents to merge
            strategy: Fusion strategy to use
            max_docs: Maximum documents (default from config)
            
        Returns:
            FusedContext with merged and formatted documents
        """
        if not documents:
            return FusedContext(
                documents=[],
                formatted_context="No documents retrieved.",
                source_distribution={},
                citations=[]
            )
        
        max_docs = max_docs or self.config.max_docs
        
        # Apply strategy
        if strategy == FusionStrategy.WEIGHTED:
            ranked = self._weighted_rank(documents.copy())
        elif strategy == FusionStrategy.ROUND_ROBIN:
            ranked = self._round_robin(documents.copy())
        else:  # TOP_K
            ranked = sorted(documents, key=lambda x: -x.similarity)
        
        final_docs = ranked[:max_docs]
        
        return FusedContext(
            documents=final_docs,
            formatted_context=self._format_context(final_docs),
            source_distribution=self._count_sources(final_docs),
            citations=self._generate_citations(final_docs)
        )
    
    def _weighted_rank(self, docs: List[RetrievedDocument]) -> List[RetrievedDocument]:
        """Rank with source-based weights."""
        for doc in docs:
            weight = self.config.get_weight(doc.source_index)
            doc.similarity = doc.similarity * weight
        return sorted(docs, key=lambda x: -x.similarity)
    
    def _round_robin(self, docs: List[RetrievedDocument]) -> List[RetrievedDocument]:
        """Interleave from different sources."""
        by_source = {}
        for doc in docs:
            by_source.setdefault(doc.source_index, []).append(doc)
        
        for source in by_source:
            by_source[source].sort(key=lambda x: -x.similarity)
        
        result = []
        max_len = max(len(v) for v in by_source.values()) if by_source else 0
        
        for i in range(max_len):
            for source in self.SOURCE_ORDER:
                if source in by_source and i < len(by_source[source]):
                    result.append(by_source[source][i])
        
        return result
    
    def _format_context(
        self,
        docs: List[RetrievedDocument],
        max_chars: int = 2000
    ) -> str:
        """Format documents as LLM context."""
        parts = []
        for i, doc in enumerate(docs, 1):
            content = doc.content[:max_chars] + "..." if len(doc.content) > max_chars else doc.content
            parts.append(f"[{i}] ({doc.source_index.upper()}) {content}")
        return "\n\n".join(parts)
    
    @staticmethod
    def _count_sources(docs: List[RetrievedDocument]) -> Dict[str, int]:
        """Count documents per source."""
        distribution = {}
        for doc in docs:
            distribution[doc.source_index] = distribution.get(doc.source_index, 0) + 1
        return distribution
    
    @staticmethod
    def _generate_citations(docs: List[RetrievedDocument]) -> List[dict]:
        """Generate citation list."""
        return [
            {
                "number": i,
                "source": doc.source_index,
                "preview": doc.content[:100] + "..." if len(doc.content) > 100 else doc.content,
                "similarity": round(doc.similarity, 4),
            }
            for i, doc in enumerate(docs, 1)
        ]
    
    def format_by_sub_query(
        self,
        sub_query_results: Dict[str, List[RetrievedDocument]],
        max_docs_per_query: int = 5,
        max_chars_per_doc: int = 2000
    ) -> Tuple[Dict[str, str], List[dict]]:
        """
        Format contexts organized by sub-query for CAF.
        
        This method preserves the relationship between sub-queries and their
        retrieved documents, which is essential for the Canonical Answer Framework.
        
        Args:
            sub_query_results: Dict mapping sub-query -> list of documents
            max_docs_per_query: Maximum documents per sub-query
            max_chars_per_doc: Maximum characters per document
            
        Returns:
            Tuple of (sub_query_contexts: Dict[str, str], citations: List[dict])
            
        Example:
            >>> fusion = ResultFusion()
            >>> contexts, citations = fusion.format_by_sub_query(
            ...     {"ROE là gì": [doc1, doc2], "VNM có ROE bao nhiêu": [doc3, doc4]}
            ... )
            >>> print(contexts.keys())
            dict_keys(['ROE là gì', 'VNM có ROE bao nhiêu'])
        """
        sub_query_contexts = {}
        all_citations = []
        citation_num = 1
        
        for sub_query, docs in sub_query_results.items():
            if not docs:
                continue
                
            # Take top docs for this sub-query
            top_docs = sorted(docs, key=lambda x: -x.similarity)[:max_docs_per_query]
            
            parts = []
            for doc in top_docs:
                # Truncate content if needed
                content = doc.content
                if len(content) > max_chars_per_doc:
                    content = content[:max_chars_per_doc] + "..."
                
                # Format with citation number
                parts.append(f"[{citation_num}] ({doc.source_index.upper()}) {content}")
                
                # Add to citations list
                all_citations.append({
                    "number": citation_num,
                    "source": doc.source_index,
                    "sub_query": sub_query,
                    "preview": doc.content[:100] + "..." if len(doc.content) > 100 else doc.content,
                    "similarity": round(doc.similarity, 4),
                })
                citation_num += 1
            
            sub_query_contexts[sub_query] = "\n\n".join(parts)
        
        return sub_query_contexts, all_citations
