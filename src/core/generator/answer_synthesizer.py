"""
Canonical Answer Synthesizer (CAF Pass 2).

Synthesizes structured answers from canonical facts.
This is the second pass of the Canonical Answer Framework.

SOLID Principles:
- Single Responsibility: Only handles answer synthesis
- Open/Closed: Uses prompts from prompts.py, config from config.py
- Dependency Inversion: Depends on abstractions (GeneratorConfig, LLMClient)
"""
import json
import re
import logging
from typing import List, Dict, Optional, Protocol

from .canonical_types import (
    CanonicalFact, 
    CanonicalFactList, 
    FactDomain
)
from .config import GeneratorConfig
from .prompts import build_caf_synthesis_prompt

logger = logging.getLogger(__name__)


class LLMClient(Protocol):
    """Protocol for LLM client - enables dependency injection."""
    def generate(self, prompt: str, temperature: float, max_tokens: int) -> str:
        ...
    
    @property
    def is_available(self) -> bool:
        ...


class GeminiClientAdapter:
    """
    Adapter for Gemini client.
    
    Encapsulates Gemini-specific logic and provides a clean interface.
    Config is loaded from environment via GeneratorConfig.
    """
    
    def __init__(self, config: GeneratorConfig = None):
        """
        Initialize with config from environment.
        
        Args:
            config: GeneratorConfig instance (defaults to from_env())
        """
        self.config = config or GeneratorConfig.from_env()
        self._client = None
        self._available = False
        self._init_client()
    
    def _init_client(self):
        """Initialize Gemini client from environment config."""
        try:
            from google import genai
            import os
            
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                logger.warning("GEMINI_API_KEY not set in environment")
                return
            
            self._client = genai.Client(api_key=api_key)
            self._available = True
            logger.info(f"Gemini client initialized with model: {self.config.model_name}")
            
        except ImportError:
            logger.warning("google-genai not installed")
        except Exception as e:
            logger.error(f"Failed to initialize Gemini client: {e}")
    
    @property
    def is_available(self) -> bool:
        return self._available
    
    def generate(self, prompt: str, temperature: float = None, max_tokens: int = None) -> str:
        """
        Generate content using Gemini.
        
        Args:
            prompt: Full prompt text
            temperature: Override default temperature
            max_tokens: Override default max tokens
            
        Returns:
            Generated text
        """
        if not self._available:
            raise RuntimeError("Gemini client not available")
        
        from google.genai import types
        
        config = types.GenerateContentConfig(
            temperature=temperature or self.config.temperature,
            max_output_tokens=max_tokens or self.config.max_tokens
        )
        
        response = self._client.models.generate_content(
            model=self.config.model_name,
            contents=prompt,
            config=config
        )
        
        return response.text


class CanonicalAnswerSynthesizer:
    """
    Pass 2 of CAF: Synthesize answer from canonical facts.
    
    Takes a list of CanonicalFact objects and synthesizes a structured
    answer following the Canonical Answer Structure.
    
    Example:
        >>> synthesizer = CanonicalAnswerSynthesizer()
        >>> answer = synthesizer.synthesize(
        ...     original_query="Điều kiện thành lập công ty XNK?",
        ...     facts=fact_list
        ... )
        >>> print(answer[:100])
        '## 1. Tổng quan...'
    """
    
    def __init__(self, llm_client: LLMClient = None, config: GeneratorConfig = None):
        """
        Initialize the answer synthesizer.
        
        Args:
            llm_client: LLM client for generation (default: GeminiClientAdapter)
            config: Generator configuration (default: from environment)
        """
        self.config = config or GeneratorConfig.from_env()
        self._llm_client = llm_client
    
    @property
    def llm_client(self) -> LLMClient:
        """Lazy-load LLM client."""
        if self._llm_client is None:
            self._llm_client = GeminiClientAdapter(self.config)
        return self._llm_client
    
    def synthesize(
        self,
        original_query: str,
        facts: CanonicalFactList
    ) -> str:
        """
        Synthesize answer from canonical facts.
        
        Args:
            original_query: The original user query
            facts: CanonicalFactList containing extracted facts
            
        Returns:
            Structured answer as markdown string
        """
        if not facts or len(facts) == 0:
            logger.warning("No canonical facts provided")
            return self._generate_no_facts_response(original_query)
        
        if not self.llm_client.is_available:
            logger.error("LLM client not available")
            return self._generate_error_response()
        
        # Prepare facts for prompt
        facts_json = self._prepare_facts_for_prompt(facts)
        
        # Build prompt using prompts.py
        prompt = build_caf_synthesis_prompt(original_query, facts_json)
        
        try:
            # Call LLM
            answer = self.llm_client.generate(
                prompt=prompt,
                temperature=self.config.temperature,
                max_tokens=self.config.max_tokens
            )
            
            # Validate and clean answer
            answer = self._validate_answer(answer)
            
            logger.info(f"[CAS] Synthesized answer with {len(answer)} chars")
            return answer
            
        except Exception as e:
            logger.error(f"[CAS] Synthesis error: {e}")
            return self._generate_error_response()
    
    def _prepare_facts_for_prompt(self, facts: CanonicalFactList) -> str:
        """Prepare facts as a formatted JSON string for the prompt."""
        # Group facts by domain for better organization
        grouped = facts.group_by_domain()
        
        formatted_facts = []
        for domain, domain_facts in grouped.items():
            for fact in domain_facts:
                formatted_facts.append({
                    "domain": fact.domain.value,
                    "fact_type": fact.fact_type.value,
                    "statement": fact.statement,
                    "relevance": fact.relevance.value,
                    "source_id": fact.source_id,
                    "sub_query": fact.sub_query
                })
        
        return json.dumps(formatted_facts, ensure_ascii=False, indent=2)
    
    def _validate_answer(self, answer: str) -> str:
        """Validate and clean the synthesized answer."""
        # Remove markdown code blocks if LLM wrapped the answer
        answer = answer.strip()
        if answer.startswith("```markdown"):
            answer = answer[11:]
        if answer.startswith("```"):
            answer = answer[3:]
        if answer.endswith("```"):
            answer = answer[:-3]
        answer = answer.strip()
        
        # Ensure "Lưu ý & Giới hạn" section exists
        if "## 4." not in answer and "Lưu ý" not in answer and "Giới hạn" not in answer:
            answer += "\n\n## 4. Lưu ý & Giới hạn\n\nThông tin trên được tổng hợp từ các tài liệu có sẵn. Vui lòng tham khảo thêm các nguồn chính thức và chuyên gia tư vấn cho các quyết định quan trọng."
        
        return answer
    
    def _generate_no_facts_response(self, query: str) -> str:
        """Generate response when no facts are available."""
        return f"""## 1. Tổng quan

Không tìm thấy thông tin cụ thể trong cơ sở dữ liệu để trả lời câu hỏi: "{query}"

## 4. Lưu ý & Giới hạn

Hệ thống không có đủ dữ liệu liên quan đến câu hỏi của bạn. Vui lòng:
- Thử diễn đạt lại câu hỏi
- Kiểm tra các thuật ngữ chính xác hơn
- Liên hệ chuyên gia tư vấn nếu cần thông tin chi tiết"""
    
    def _generate_error_response(self) -> str:
        """Generate response when an error occurs."""
        return """## Lỗi hệ thống

Đã xảy ra lỗi trong quá trình tổng hợp câu trả lời. Vui lòng thử lại sau.

## 4. Lưu ý & Giới hạn

Nếu lỗi tiếp tục xảy ra, vui lòng liên hệ bộ phận hỗ trợ."""
    
    def extract_citations_used(self, answer: str) -> List[int]:
        """Extract citation numbers used in the answer."""
        pattern = r'\[(\d+)\]'
        matches = re.findall(pattern, answer)
        return sorted(set(int(m) for m in matches))
