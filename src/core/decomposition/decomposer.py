"""
Query Decomposer using LLM (Gemini) with Structured Output.

Decomposes complex queries into atomic sub-queries for better retrieval.
Uses Gemini Structured Output Schema to ensure 100% valid JSON responses.

SOLID Principles:
- Single Responsibility: Only handles decomposition logic
- Open/Closed: Extensible via config, closed for modification
- Dependency Inversion: Depends on abstractions (config, classifier interface)
"""
import json
import time
import os
import logging
from typing import List, Optional, Protocol
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()

from src.config import DecomposerConfig, QueryType
from .classifier import QueryComplexityClassifier, ClassificationResult

# Setup logging
logger = logging.getLogger(__name__)


# Optional Gemini import
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed. LLM decomposition disabled.")


@dataclass
class SubQuery:
    """
    A decomposed sub-query with type and order.
    
    Attributes:
        query: The sub-query text
        query_type: Type classification (GLOSSARY, LEGAL, FINANCIAL, NEWS)
        order: Execution order (for dependent queries)
    """
    query: str
    query_type: str = QueryType.UNKNOWN
    order: int = 1
    
    def to_dict(self) -> dict:
        return {
            "query": self.query,
            "type": self.query_type,
            "order": self.order
        }
    
    def __str__(self) -> str:
        return f"[{self.query_type}] {self.query}"


@dataclass
class DecompositionResult:
    """
    Result of query decomposition.
    
    Attributes:
        original_query: The original user query
        is_decomposed: Whether decomposition was performed
        sub_queries: List of atomic sub-queries
        reasoning: Explanation of decomposition logic
        latency_ms: Processing time in milliseconds
        method: How decomposition was done (classifier, llm, fallback)
    """
    original_query: str
    is_decomposed: bool
    sub_queries: List[SubQuery]
    reasoning: str = ""
    latency_ms: float = 0.0
    method: str = "unknown"
    
    def to_dict(self) -> dict:
        return {
            "original_query": self.original_query,
            "is_decomposed": self.is_decomposed,
            "sub_queries": [sq.to_dict() for sq in self.sub_queries],
            "reasoning": self.reasoning,
            "latency_ms": round(self.latency_ms, 2),
            "method": self.method
        }
    
    @property
    def query_count(self) -> int:
        return len(self.sub_queries)
    
    def get_queries_by_type(self, query_type: str) -> List[SubQuery]:
        """Get sub-queries filtered by type."""
        return [sq for sq in self.sub_queries if sq.query_type == query_type]


class LLMClientProtocol(Protocol):
    """Protocol for LLM client (Dependency Inversion)."""
    
    def generate_structured(self, prompt: str) -> dict:
        """Generate structured JSON response from prompt."""
        ...


def _build_decomposition_schema():
    """Build Gemini schema for structured output."""
    if not GEMINI_AVAILABLE:
        return None
    
    # Schema for sub-query
    sub_query_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "query": types.Schema(
                type=types.Type.STRING,
                description="Câu hỏi con, PHẢI giữ đầy đủ context để tìm kiếm độc lập"
            ),
            "query_type": types.Schema(
                type=types.Type.STRING,
                enum=["LEGAL", "FINANCIAL", "NEWS", "GLOSSARY"],
                description="Loại index phù hợp nhất để tìm kiếm"
            ),
            "order": types.Schema(
                type=types.Type.INTEGER,
                description="Thứ tự thực hiện (1 = đầu tiên)"
            ),
        },
        required=["query", "query_type", "order"]
    )
    
    # Main decomposition schema
    decomposition_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "is_decomposed": types.Schema(
                type=types.Type.BOOLEAN,
                description="True nếu câu hỏi được phân tách thành nhiều sub-queries"
            ),
            "sub_queries": types.Schema(
                type=types.Type.ARRAY,
                items=sub_query_schema,
                description="Danh sách các câu hỏi con"
            ),
            "reasoning": types.Schema(
                type=types.Type.STRING,
                description="Giải thích ngắn gọn cách phân tách"
            ),
        },
        required=["is_decomposed", "sub_queries", "reasoning"]
    )
    
    return decomposition_schema


class GeminiStructuredClient:
    """
    Gemini API client with Structured Output support.
    
    Uses response_mime_type="application/json" and response_schema
    to force LLM to return valid JSON matching the schema.
    """
    
    def __init__(self, model_name: str, api_key: Optional[str] = None):
        if not GEMINI_AVAILABLE:
            raise ImportError("google-genai not installed")
        
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found")
        
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
        self.schema = _build_decomposition_schema()
        
        # Config với Structured Output
        self.config = types.GenerateContentConfig(
            temperature=0.1,
            max_output_tokens=2048,
            response_mime_type="application/json",
            response_schema=self.schema
        )
    
    def generate_structured(self, prompt: str) -> dict:
        """
        Generate response and parse as JSON.
        
        Returns:
            dict: Parsed JSON response matching schema
        """
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=prompt,
            config=self.config
        )
        
        # With structured output, response.text is guaranteed valid JSON
        return json.loads(response.text)


# Decomposition prompt - optimized for structured output
DECOMPOSITION_PROMPT = """Bạn là Query Decomposer chuyên phân tách câu hỏi phức tạp.

NHIỆM VỤ: Phân tách câu hỏi thành các sub-queries độc lập.

CÁC LOẠI INDEX:
- LEGAL: Luật, quy định, điều kiện pháp lý, nghĩa vụ
- FINANCIAL: Chỉ số tài chính, báo cáo, phân tích công ty
- NEWS: Tin tức, xu hướng thị trường, sự kiện
- GLOSSARY: Định nghĩa thuật ngữ, khái niệm

QUY TẮC QUAN TRỌNG:
1. Mỗi sub-query PHẢI giữ đầy đủ context để tìm kiếm độc lập
2. KHÔNG dùng đại từ (nó, đó, này) - phải có subject rõ ràng
3. Ưu tiên LEGAL cho câu hỏi về điều kiện, quy định
4. Một sub-query CHỈ được gán MỘT query_type

VÍ DỤ:
Input: "ROE là gì và VNM có ROE bao nhiêu?"
Output:
- [GLOSSARY] "ROE (Return on Equity) là gì? Định nghĩa và cách tính"
- [FINANCIAL] "Công ty Vinamilk (VNM) có chỉ số ROE là bao nhiêu?"

VÍ DỤ 2:
Input: "Muốn thành lập công ty xuất nhập khẩu cần điều kiện gì và cho tôi một số doanh nghiệp tham khảo?"
Output:
- [LEGAL] "Điều kiện pháp lý để thành lập công ty xuất nhập khẩu tại Việt Nam là gì?"
- [FINANCIAL] "Các doanh nghiệp xuất nhập khẩu uy tín tại Việt Nam để tham khảo"

---

CÂU HỎI CẦN PHÂN TÁCH:
{query}

Hãy phân tách câu hỏi trên thành các sub-queries."""


class QueryDecomposer:
    """
    Decompose complex queries into atomic sub-queries.
    
    Uses a two-stage approach:
    1. Fast classifier to detect if decomposition is needed
    2. LLM (Gemini) with Structured Output for decomposition
    
    Example:
        >>> decomposer = QueryDecomposer()
        >>> result = decomposer.decompose("ROE là gì và VNM có ROE bao nhiêu")
        >>> for sq in result.sub_queries:
        ...     print(sq)
        [GLOSSARY] ROE là gì
        [FINANCIAL] VNM có ROE bao nhiêu
    """
    
    def __init__(
        self,
        config: DecomposerConfig = None,
        classifier: QueryComplexityClassifier = None,
        llm_client: LLMClientProtocol = None,
        use_classifier: bool = True
    ):
        """
        Initialize the decomposer.
        
        Args:
            config: Decomposer configuration
            classifier: Query complexity classifier (injected)
            llm_client: LLM client for decomposition (injected)
            use_classifier: Whether to use classifier as first-pass filter
        """
        self.config = config or DecomposerConfig()
        self.classifier = classifier or (QueryComplexityClassifier() if use_classifier else None)
        self.llm_client = llm_client
        
        # Lazy init LLM client if not provided
        if self.llm_client is None and GEMINI_AVAILABLE:
            try:
                self.llm_client = GeminiStructuredClient(self.config.model_name)
                logger.info("Initialized Gemini Structured Output client")
            except (ImportError, ValueError) as e:
                logger.warning(f"Could not initialize Gemini: {e}")
    
    def decompose(self, query: str) -> DecompositionResult:
        """
        Decompose a query into sub-queries.
        
        Args:
            query: User query string
            
        Returns:
            DecompositionResult with sub-queries
        """
        start = time.time()
        query = query.strip()
        
        # Step 1: Quick check with classifier
        if self.classifier:
            classification = self.classifier.classify(query)
            if not classification.is_complex:
                return DecompositionResult(
                    original_query=query,
                    is_decomposed=False,
                    sub_queries=[SubQuery(query=query)],
                    reasoning=f"Simple query: {classification.reason}",
                    latency_ms=(time.time() - start) * 1000,
                    method="classifier"
                )
        
        # Step 2: Use LLM with Structured Output for complex queries
        if self.llm_client:
            try:
                result = self._llm_decompose(query)
                result.latency_ms = (time.time() - start) * 1000
                result.method = "llm_structured"
                return result
            except Exception as e:
                logger.warning(f"LLM decomposition failed: {e}")
        
        # Fallback: Return original query
        return DecompositionResult(
            original_query=query,
            is_decomposed=False,
            sub_queries=[SubQuery(query=query)],
            reasoning="Decomposition unavailable, using original query",
            latency_ms=(time.time() - start) * 1000,
            method="fallback"
        )
    
    def _llm_decompose(self, query: str) -> DecompositionResult:
        """Use LLM with Structured Output to decompose the query."""
        prompt = DECOMPOSITION_PROMPT.format(query=query)
        
        # With Structured Output, this returns valid dict directly
        data = self.llm_client.generate_structured(prompt)
        
        # Convert to SubQuery objects
        sub_queries = []
        for i, sq in enumerate(data.get("sub_queries", [])[:self.config.max_sub_queries]):
            sub_queries.append(SubQuery(
                query=sq.get("query", query),
                query_type=sq.get("query_type", QueryType.UNKNOWN),
                order=sq.get("order", i + 1)
            ))
        
        if not sub_queries:
            sub_queries = [SubQuery(query=query)]
        
        return DecompositionResult(
            original_query=query,
            is_decomposed=data.get("is_decomposed", len(sub_queries) > 1),
            sub_queries=sub_queries,
            reasoning=data.get("reasoning", "")
        )
    
    def decompose_batch(self, queries: List[str]) -> List[DecompositionResult]:
        """Decompose multiple queries."""
        return [self.decompose(q) for q in queries]
