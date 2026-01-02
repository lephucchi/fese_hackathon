"""
Parallel retrieval across multiple Supabase vector indices.

Follows SOLID principles:
- Single Responsibility: Only handles retrieval, not fusion
- Open/Closed: Extensible via config and dependency injection
- Dependency Inversion: Uses protocols for database and encoder
"""
import asyncio
import time
import logging
import threading
from typing import List, Dict, Optional, Tuple, Protocol
from dataclasses import dataclass, field

from src.config import RetrieverConfig, INDEX_TABLE_MAP

logger = logging.getLogger(__name__)

# Global lock for thread-safe encoder loading
_encoder_lock = threading.Lock()

# Optional imports
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    logger.warning("supabase not installed")

try:
    from sentence_transformers import SentenceTransformer
    ENCODER_AVAILABLE = True
except ImportError:
    ENCODER_AVAILABLE = False
    logger.warning("sentence-transformers not installed")


@dataclass
class RetrievedDocument:
    """
    A retrieved document with metadata.
    
    Attributes:
        content: Document text content
        source_index: Which index this came from
        similarity: Cosine similarity score
        metadata: Additional document metadata
        sub_query: Which sub-query retrieved this
        doc_id: Database document ID
    """
    content: str
    source_index: str
    similarity: float
    metadata: dict = field(default_factory=dict)
    sub_query: str = ""
    doc_id: Optional[int] = None
    
    def to_dict(self) -> dict:
        return {
            "content": self.content,
            "source_index": self.source_index,
            "similarity": round(self.similarity, 4),
            "metadata": self.metadata,
            "sub_query": self.sub_query,
        }
    
    def __repr__(self) -> str:
        preview = self.content[:50] + "..." if len(self.content) > 50 else self.content
        return f"Doc({self.source_index}, {self.similarity:.2f}, '{preview}')"


@dataclass
class RetrievalResult:
    """
    Result of parallel retrieval.
    
    Attributes:
        documents: All retrieved documents (deduplicated)
        sub_query_results: Documents grouped by sub-query
        total_time_ms: Total retrieval time
        per_index_time_ms: Time per index
    """
    documents: List[RetrievedDocument]
    sub_query_results: Dict[str, List[RetrievedDocument]] = field(default_factory=dict)
    total_time_ms: float = 0.0
    per_index_time_ms: Dict[str, float] = field(default_factory=dict)
    
    @property
    def total_docs(self) -> int:
        return len(self.documents)
    
    def to_dict(self) -> dict:
        return {
            "total_docs": self.total_docs,
            "total_time_ms": round(self.total_time_ms, 2),
            "per_index_time_ms": {k: round(v, 2) for k, v in self.per_index_time_ms.items()},
            "documents": [d.to_dict() for d in self.documents],
        }


class EncoderProtocol(Protocol):
    """Protocol for text encoder."""
    def encode(self, text: str) -> list:
        """Encode text to embedding vector."""
        ...


class VectorDBProtocol(Protocol):
    """Protocol for vector database."""
    def search(self, table: str, embedding: list, k: int) -> List[dict]:
        """Search for similar documents."""
        ...


class SentenceTransformerEncoder:
    """SentenceTransformer implementation of encoder."""
    
    def __init__(self, model_name: str):
        if not ENCODER_AVAILABLE:
            raise ImportError("sentence-transformers not installed")
        logger.info(f"Loading encoder: {model_name}")
        self._model = SentenceTransformer(model_name)
    
    def encode(self, text: str) -> list:
        return self._model.encode(text).tolist()


class SupabaseVectorDB:
    """Supabase implementation of vector database."""
    
    def __init__(self, url: str, key: str):
        if not SUPABASE_AVAILABLE:
            raise ImportError("supabase not installed")
        self._client = create_client(url, key)
    
    def search(self, table: str, embedding: list, k: int) -> List[dict]:
        """Search using Supabase RPC."""
        response = self._client.rpc(
            "match_documents",
            {
                "_query_embedding": embedding,
                "_match_count": k,
                "_table_name": table
            }
        ).execute()
        return response.data if response.data else []


class ParallelRetriever:
    """
    Async parallel retrieval from multiple vector indices.
    
    Example:
        >>> retriever = ParallelRetriever()
        >>> result = retriever.retrieve_all(
        ...     sub_queries=["ROE là gì", "VNM có ROE bao nhiêu"],
        ...     routes=["glossary", "financial"]
        ... )
        >>> print(result.total_docs)
    """
    
    def __init__(
        self,
        config: RetrieverConfig = None,
        encoder: EncoderProtocol = None,
        vector_db: VectorDBProtocol = None
    ):
        """
        Initialize retriever with dependency injection.
        
        Args:
            config: Retriever configuration
            encoder: Text encoder (injected)
            vector_db: Vector database client (injected)
        """
        self.config = config or RetrieverConfig.from_env()
        self._encoder = encoder
        self._vector_db = vector_db
    
    @property
    def encoder(self) -> EncoderProtocol:
        """Lazy-load encoder with thread safety."""
        if self._encoder is None and ENCODER_AVAILABLE:
            with _encoder_lock:
                # Double-check pattern to avoid race condition
                if self._encoder is None:
                    self._encoder = SentenceTransformerEncoder(self.config.encoder_model)
        return self._encoder
    
    @property
    def vector_db(self) -> VectorDBProtocol:
        """Lazy-load vector database."""
        if self._vector_db is None and SUPABASE_AVAILABLE:
            if self.config.supabase_url and self.config.supabase_key:
                self._vector_db = SupabaseVectorDB(
                    self.config.supabase_url,
                    self.config.supabase_key
                )
        return self._vector_db
    
    def retrieve(
        self,
        query: str,
        index: str,
        k: Optional[int] = None
    ) -> List[RetrievedDocument]:
        """
        Retrieve from a single index synchronously.
        
        Args:
            query: Query string
            index: Index name
            k: Number of results (default from config)
            
        Returns:
            List of retrieved documents
        """
        if not self.encoder or not self.vector_db:
            logger.warning("Encoder or VectorDB not available")
            return []
        
        k = k or self.config.k_per_index
        table = INDEX_TABLE_MAP.get(index, f"{index}_index")
        
        try:
            embedding = self.encoder.encode(query)
            results = self.vector_db.search(table, embedding, k)
            
            return [
                RetrievedDocument(
                    content=row.get("content", ""),
                    source_index=index,
                    similarity=row.get("similarity", 0.0),
                    metadata=row.get("metadata", {}),
                    sub_query=query,
                    doc_id=row.get("id")
                )
                for row in results
            ]
        except Exception as e:
            logger.error(f"Retrieval error for {index}: {e}")
            return []
    
    async def retrieve_async(
        self,
        query: str,
        index: str,
        k: Optional[int] = None
    ) -> Tuple[List[RetrievedDocument], float]:
        """Retrieve asynchronously."""
        start = time.time()
        loop = asyncio.get_event_loop()
        docs = await loop.run_in_executor(None, lambda: self.retrieve(query, index, k))
        return docs, (time.time() - start) * 1000
    
    async def retrieve_all_async(
        self,
        sub_queries: List[str],
        routes: List[str],
        k_per_index: Optional[int] = None
    ) -> RetrievalResult:
        """
        Retrieve from multiple indices in parallel.
        
        Args:
            sub_queries: List of sub-query strings
            routes: List of index names (parallel to sub_queries)
            k_per_index: Results per index
            
        Returns:
            RetrievalResult with all documents
        """
        start = time.time()
        k = k_per_index or self.config.k_per_index
        
        # Pre-load encoder and vector_db BEFORE parallel tasks
        # This prevents multiple threads from trying to load the model simultaneously
        _ = self.encoder
        _ = self.vector_db
        
        # Create parallel tasks
        tasks = [
            self.retrieve_async(sq, route, k)
            for sq, route in zip(sub_queries, routes)
        ]
        
        # Execute with timeout
        try:
            results = await asyncio.wait_for(
                asyncio.gather(*tasks, return_exceptions=True),
                timeout=self.config.timeout_seconds
            )
        except asyncio.TimeoutError:
            logger.warning(f"Retrieval timeout after {self.config.timeout_seconds}s")
            results = [([], 0.0)] * len(tasks)
        
        # Aggregate results
        all_docs = []
        sub_query_results = {}
        per_index_time = {}
        
        for (sq, route), result in zip(zip(sub_queries, routes), results):
            if isinstance(result, Exception):
                logger.error(f"Task error: {result}")
                sub_query_results[sq] = []
            else:
                docs, time_ms = result
                sub_query_results[sq] = docs
                all_docs.extend(docs)
                per_index_time[route] = time_ms
        
        # Deduplicate
        unique_docs = self._deduplicate(all_docs)
        
        return RetrievalResult(
            documents=unique_docs,
            sub_query_results=sub_query_results,
            total_time_ms=(time.time() - start) * 1000,
            per_index_time_ms=per_index_time
        )
    
    def retrieve_all(
        self,
        sub_queries: List[str],
        routes: List[str],
        k_per_index: Optional[int] = None
    ) -> RetrievalResult:
        """Synchronous wrapper for retrieve_all_async."""
        try:
            # Try to get the current event loop
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # If we're already in an async context, create a new task
                import nest_asyncio
                nest_asyncio.apply()
                return loop.run_until_complete(self.retrieve_all_async(sub_queries, routes, k_per_index))
            else:
                # If no loop is running, use asyncio.run
                return asyncio.run(self.retrieve_all_async(sub_queries, routes, k_per_index))
        except RuntimeError:
            # Fallback: create new event loop
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                return loop.run_until_complete(self.retrieve_all_async(sub_queries, routes, k_per_index))
            finally:
                loop.close()
    
    @staticmethod
    def _deduplicate(docs: List[RetrievedDocument]) -> List[RetrievedDocument]:
        """Remove duplicate documents, keeping highest similarity."""
        seen = {}
        for doc in docs:
            content_hash = hash(doc.content[:200] if doc.content else "")
            if content_hash not in seen or doc.similarity > seen[content_hash].similarity:
                seen[content_hash] = doc
        return sorted(seen.values(), key=lambda x: -x.similarity)
