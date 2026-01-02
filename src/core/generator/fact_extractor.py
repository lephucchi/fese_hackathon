"""
Canonical Fact Extractor (CAF Pass 1) with Structured Output.

Extracts structured facts from retrieved documents into CanonicalFact schema.
Uses Gemini Structured Output Schema to ensure 100% valid JSON responses.

SOLID Principles:
- Single Responsibility: Only handles fact extraction
- Open/Closed: Uses prompts from prompts.py, config from config.py
- Dependency Inversion: Depends on abstractions (GeneratorConfig)
"""
import json
import logging
import os
from typing import List, Dict, Optional, Protocol

from .canonical_types import (
    CanonicalFact, 
    CanonicalFactList, 
    FactDomain, 
    FactType, 
    Relevance
)
from .config import GeneratorConfig
from .prompts import CAF_EXTRACTION_SYSTEM

logger = logging.getLogger(__name__)


# Optional Gemini import
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed")


def _build_fact_extraction_schema():
    """Build Gemini schema for fact extraction."""
    if not GEMINI_AVAILABLE:
        return None
    
    # Schema for a single fact
    fact_schema = types.Schema(
        type=types.Type.OBJECT,
        properties={
            "domain": types.Schema(
                type=types.Type.STRING,
                enum=["LEGAL", "FINANCIAL", "NEWS", "GLOSSARY"],
                description="Lĩnh vực của fact"
            ),
            "fact_type": types.Schema(
                type=types.Type.STRING,
                enum=["definition", "regulation", "requirement", "metric", "trend", "example"],
                description="Loại thông tin"
            ),
            "statement": types.Schema(
                type=types.Type.STRING,
                description="Câu khẳng định ngắn gọn (1-2 câu)"
            ),
            "scope": types.Schema(
                type=types.Type.STRING,
                description="Phạm vi: Vietnam, Global, hoặc Company: <tên>"
            ),
            "relevance": types.Schema(
                type=types.Type.STRING,
                enum=["HIGH", "MEDIUM", "LOW"],
                description="Mức độ liên quan"
            ),
            "source_id": types.Schema(
                type=types.Type.INTEGER,
                description="Số citation [1], [2], ..."
            ),
            "sub_query": types.Schema(
                type=types.Type.STRING,
                description="Sub-query mà fact này trả lời"
            ),
        },
        required=["domain", "fact_type", "statement", "relevance", "source_id"]
    )
    
    # Schema for array of facts
    facts_array_schema = types.Schema(
        type=types.Type.ARRAY,
        items=fact_schema,
        description="Danh sách các Canonical Facts"
    )
    
    return facts_array_schema


class GeminiFactExtractionClient:
    """
    Gemini API client for fact extraction with Structured Output.
    """
    
    def __init__(self, config: GeneratorConfig = None):
        if not GEMINI_AVAILABLE:
            raise ImportError("google-genai not installed")
        
        self.config = config or GeneratorConfig.from_env()
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found")
        
        self._client = genai.Client(api_key=api_key)
        self._schema = _build_fact_extraction_schema()
        self._available = True
        
        logger.info(f"Gemini Fact Extraction client initialized with model: {self.config.model_name}")
    
    @property
    def is_available(self) -> bool:
        return self._available
    
    def extract_facts(self, prompt: str) -> List[Dict]:
        """
        Extract facts using Gemini Structured Output.
        
        Returns:
            List of fact dictionaries
        """
        config = types.GenerateContentConfig(
            temperature=0.1,  # Low for factual extraction
            max_output_tokens=8192,  # Increased to avoid truncation
            response_mime_type="application/json",
            response_schema=self._schema
        )
        
        response = self._client.models.generate_content(
            model=self.config.model_name,
            contents=prompt,
            config=config
        )
        
        # Try to parse, with fallback repair for truncated JSON
        return self._parse_with_repair(response.text)
    
    def _parse_with_repair(self, text: str) -> List[Dict]:
        """Parse JSON with repair attempts for truncated responses."""
        import re
        
        # Try direct parse first
        try:
            data = json.loads(text)
            if isinstance(data, list):
                return data
            return []
        except json.JSONDecodeError:
            pass
        
        # Attempt 1: Fix truncated array - find last complete object
        try:
            # Find all complete objects in the array
            matches = list(re.finditer(r'\{[^{}]*\}', text))
            if matches:
                last_complete = matches[-1].end()
                # Rebuild array with complete objects
                repaired = text[:last_complete] + ']'
                # Ensure it starts with [
                if not repaired.strip().startswith('['):
                    repaired = '[' + repaired
                data = json.loads(repaired)
                if isinstance(data, list):
                    logger.warning(f"[CFE] Repaired truncated JSON, got {len(data)} facts")
                    return data
        except json.JSONDecodeError:
            pass
        
        # Attempt 2: Extract individual objects
        try:
            objects = []
            for match in re.finditer(r'\{[^{}]+\}', text):
                try:
                    obj = json.loads(match.group())
                    if 'statement' in obj:  # Validate it's a fact
                        objects.append(obj)
                except json.JSONDecodeError:
                    continue
            if objects:
                logger.warning(f"[CFE] Extracted {len(objects)} facts via regex")
                return objects
        except Exception:
            pass
        
        logger.error(f"[CFE] Could not repair JSON: {text[:200]}...")
        return []


class CanonicalFactExtractor:
    """
    Pass 1 of CAF: Extract structured facts from documents.
    
    Uses Gemini Structured Output to ensure 100% valid JSON.
    
    Example:
        >>> extractor = CanonicalFactExtractor()
        >>> facts = extractor.extract(
        ...     sub_query_contexts={"Điều kiện XNK": "[1] (LEGAL) ..."},
        ...     citations_map=[{"number": 1, "source": "legal", ...}]
        ... )
        >>> print(len(facts))
        5
    """
    
    def __init__(self, config: GeneratorConfig = None):
        """
        Initialize the fact extractor.
        
        Args:
            config: Generator configuration (default: from environment)
        """
        self.config = config or GeneratorConfig.from_env()
        self._llm_client = None
    
    @property
    def llm_client(self) -> GeminiFactExtractionClient:
        """Lazy-load LLM client."""
        if self._llm_client is None:
            try:
                self._llm_client = GeminiFactExtractionClient(self.config)
            except Exception as e:
                logger.error(f"Failed to initialize LLM client: {e}")
                raise
        return self._llm_client
    
    def extract(
        self,
        sub_query_contexts: Dict[str, str],
        citations_map: List[Dict] = None
    ) -> CanonicalFactList:
        """
        Extract canonical facts from sub-query contexts.
        
        Args:
            sub_query_contexts: Dict mapping sub-query -> formatted context
            citations_map: List of citation metadata
            
        Returns:
            CanonicalFactList containing extracted facts
        """
        if not sub_query_contexts:
            logger.warning("No sub_query_contexts provided")
            return CanonicalFactList()
        
        if not GEMINI_AVAILABLE:
            logger.error("Gemini not available")
            return CanonicalFactList()
        
        # Format contexts for prompt
        formatted_contexts = self._format_contexts_for_prompt(sub_query_contexts)
        
        # Build full prompt
        prompt = f"{CAF_EXTRACTION_SYSTEM}\n\nSUB-QUERIES VÀ DOCUMENTS:\n\n{formatted_contexts}\n\n---\n\nOUTPUT: Trích xuất các CanonicalFact từ documents trên."
        
        try:
            # Call LLM with Structured Output
            facts_data = self.llm_client.extract_facts(prompt)
            
            # Convert to CanonicalFact objects
            facts = [CanonicalFact.from_dict(f) for f in facts_data]
            
            logger.info(f"[CFE] Extracted {len(facts)} canonical facts")
            return CanonicalFactList(facts=facts)
            
        except Exception as e:
            logger.error(f"[CFE] Extraction error: {e}")
            return CanonicalFactList()
    
    def _format_contexts_for_prompt(self, sub_query_contexts: Dict[str, str]) -> str:
        """Format sub-query contexts into a structured string for the prompt."""
        parts = []
        for i, (sub_query, context) in enumerate(sub_query_contexts.items(), 1):
            parts.append(f"=== SUB-QUERY {i}: {sub_query} ===\n{context}")
        return "\n\n".join(parts)
    
    def extract_from_formatted_context(
        self,
        formatted_context: str,
        sub_queries: List[str]
    ) -> CanonicalFactList:
        """
        Alternative extraction method when sub_query_contexts is not available.
        """
        if not sub_queries:
            sub_queries = ["general"]
        
        sub_query_contexts = {
            sub_queries[0]: formatted_context
        }
        
        return self.extract(sub_query_contexts)
