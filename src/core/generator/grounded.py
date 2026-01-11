"""
Grounded Generator using Gemini.

Generates answers strictly grounded in retrieved context with inline citations.
Follows SOLID principles with dependency injection and protocol-based design.
"""
import re
import time
import os
import logging
from typing import List, Dict, Optional, Protocol
from dataclasses import dataclass

from .config import GeneratorConfig
from .prompts import build_generation_prompt

logger = logging.getLogger(__name__)

# Optional Gemini import
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed")


@dataclass
class GenerationResult:
    """
    Result of grounded generation.
    
    Attributes:
        answer: Generated answer with citations
        citations_used: List of citation numbers used
        is_grounded: Whether answer is properly grounded
        raw_response: Raw LLM response
        latency_ms: Processing time
    """
    answer: str
    citations_used: List[int]
    is_grounded: bool
    raw_response: str
    latency_ms: float
    
    def to_dict(self) -> dict:
        return {
            "answer": self.answer,
            "citations_used": self.citations_used,
            "is_grounded": self.is_grounded,
            "latency_ms": round(self.latency_ms, 2),
        }


class LLMProtocol(Protocol):
    """Protocol for LLM client."""
    def generate(self, prompt: str, temperature: float, max_tokens: int) -> str:
        ...


class GeminiLLM:
    """Gemini implementation of LLM protocol."""
    
    def __init__(self, model_name: str, api_key: Optional[str] = None):
        if not GEMINI_AVAILABLE:
            raise ImportError("google-genai not installed")
        
        api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found")
        
        self.client = genai.Client(api_key=api_key)
        self.model_name = model_name
    
    def generate(self, prompt: str, temperature: float = 0.3, max_tokens: int = 2048) -> str:
        config = types.GenerateContentConfig(
            temperature=temperature,
            max_output_tokens=max_tokens
        )
        
        # Retry parameters
        max_retries = 3
        base_delay = 2.0
        
        for attempt in range(max_retries + 1):
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt,
                    config=config
                )
                return response.text
                
            except Exception as e:
                # Check for transient errors (503 Service Unavailable, 429 Too Many Requests)
                error_str = str(e)
                is_transient = "503" in error_str or "429" in error_str or "overloaded" in error_str.lower()
                
                if is_transient and attempt < max_retries:
                    delay = base_delay * (2 ** attempt)  # Exponential backoff
                    logger.warning(f"Gemini API error (attempt {attempt+1}/{max_retries+1}): {e}. Retrying in {delay}s...")
                    time.sleep(delay)
                else:
                    # If not transient or out of retries, re-raise
                    logger.error(f"Gemini API failed after {attempt+1} attempts: {e}")
                    raise e
        return ""


class GroundedGenerator:
    """
    Generate grounded answers with inline citations.
    
    Uses Gemini to generate answers that are strictly grounded in the
    provided context, with [1], [2], ... citations after each claim.
    
    Example:
        >>> generator = GroundedGenerator()
        >>> result = generator.generate(
        ...     query="ROE là gì?",
        ...     context="[1] ROE là tỷ suất sinh lời trên vốn chủ sở hữu.",
        ...     citations_map=[{"number": 1, "source": "glossary", "preview": "..."}]
        ... )
        >>> print(result.answer)
        'ROE là tỷ suất sinh lời trên vốn chủ sở hữu [1].'
    """
    
    def __init__(
        self,
        config: GeneratorConfig = None,
        llm: LLMProtocol = None
    ):
        """
        Initialize with optional dependency injection.
        
        Args:
            config: Generator configuration
            llm: LLM client (injected for testing)
        """
        self.config = config or GeneratorConfig.from_env()
        self._llm = llm
    
    @property
    def llm(self) -> LLMProtocol:
        """Lazy-load LLM client."""
        if self._llm is None and GEMINI_AVAILABLE:
            self._llm = GeminiLLM(self.config.model_name)
        return self._llm
    
    def generate(
        self,
        query: str,
        context: str,
        citations_map: List[Dict] = None
    ) -> GenerationResult:
        """
        Generate grounded answer.
        
        Args:
            query: User question
            context: Formatted context with [1], [2], ... markers
            citations_map: List of citation references
            
        Returns:
            GenerationResult with answer and metadata
        """
        start = time.time()
        citations_map = citations_map or []
        
        if not self.llm:
            return GenerationResult(
                answer="Lỗi: Không thể kết nối với LLM. Vui lòng kiểm tra GEMINI_API_KEY.",
                citations_used=[],
                is_grounded=False,
                raw_response="",
                latency_ms=0.0
            )
        
        # Handle empty context
        if not context or context.strip() == "No documents retrieved.":
            return GenerationResult(
                answer="Không tìm thấy tài liệu liên quan đến câu hỏi của bạn.",
                citations_used=[],
                is_grounded=False,
                raw_response="",
                latency_ms=(time.time() - start) * 1000
            )
        
        try:
            # Build and execute prompt
            prompt = build_generation_prompt(query, context)
            raw_response = self.llm.generate(
                prompt,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens
            )
            
            # Post-process answer
            answer = self._clean_answer(raw_response)
            
            # Extract used citations
            citations_used = self._extract_citations(answer)
            
            # Validate grounding
            is_grounded = self._validate_grounding(answer, citations_used)
            
            return GenerationResult(
                answer=answer,
                citations_used=citations_used,
                is_grounded=is_grounded,
                raw_response=raw_response,
                latency_ms=(time.time() - start) * 1000
            )
            
        except Exception as e:
            logger.error(f"Generation error: {e}")
            return GenerationResult(
                answer=f"Lỗi khi tạo câu trả lời: {str(e)}",
                citations_used=[],
                is_grounded=False,
                raw_response="",
                latency_ms=(time.time() - start) * 1000
            )
    
    def _clean_answer(self, text: str) -> str:
        """Clean up LLM response."""
        text = text.strip()
        
        # Remove markdown code blocks if present
        if text.startswith("```"):
            lines = text.split("\n")
            lines = [l for l in lines if not l.strip().startswith("```")]
            text = "\n".join(lines)
        
        return text
    
    def _extract_citations(self, text: str) -> List[int]:
        """Extract citation numbers used in the answer.
        
        Handles multiple formats:
        - [1], [2], [3] - single citations
        - [1, 2], [3, 4, 5] - comma-separated citations
        - [1][2][3] - consecutive citations
        """
        # Pattern to match citation brackets with one or more numbers
        # Matches: [1], [2, 3], [1, 2, 3], etc.
        pattern = r'\[(\d+(?:\s*,\s*\d+)*)\]'
        matches = re.findall(pattern, text)
        
        all_nums = []
        for match in matches:
            # Split by comma and extract each number
            nums = [int(n.strip()) for n in match.split(',')]
            all_nums.extend(nums)
        
        return sorted(set(all_nums))
    
    def _validate_grounding(self, answer: str, citations: List[int]) -> bool:
        """
        Check if answer is properly grounded.
        
        Returns True if:
        - At least one citation is present
        - No obvious hedging phrases
        """
        if not citations:
            logger.warning("No citations in answer")
            return False
        
        # Check for hedging phrases indicating ungrounded claims
        ungrounded_phrases = [
            "tôi nghĩ", "có lẽ", "có thể là",
            "theo tôi biết", "không chắc chắn",
            "i think", "maybe", "perhaps"
        ]
        
        answer_lower = answer.lower()
        for phrase in ungrounded_phrases:
            if phrase in answer_lower:
                logger.warning(f"Potential ungrounded claim: '{phrase}'")
                return False
        
        return True
