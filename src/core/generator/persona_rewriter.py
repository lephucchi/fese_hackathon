"""
Persona Rewriter Module.

Transforms grounded answers from academic/legal style to
persona-appropriate consulting/actionable style while preserving citations.
"""
import re
import time
import os
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass
from enum import Enum

logger = logging.getLogger(__name__)

# Optional Gemini import
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False


class Persona(Enum):
    """Available user personas for answer rewriting."""
    STARTUP_FOUNDER = "startup_founder"
    INVESTOR = "investor"
    LEGAL_PROFESSIONAL = "legal_professional"
    STUDENT = "student"
    GENERAL = "general"


@dataclass
class PersonaConfig:
    """Configuration for a specific persona."""
    name: str
    style: str
    tone: str
    sections: List[str]
    priorities: List[str]


# Persona definitions
PERSONA_CONFIGS = {
    Persona.STARTUP_FOUNDER: PersonaConfig(
        name="Doanh nhân khởi nghiệp",
        style="actionable, practical, risk-aware",
        tone="professional but accessible, encouraging",
        sections=[
            "Tóm tắt nhanh",
            "Bài học từ các công ty đi trước",
            "Các bước hành động cụ thể",
            "Rủi ro cần tránh",
            "Tài nguyên tham khảo"
        ],
        priorities=[
            "Focus on actionable steps",
            "Highlight success patterns",
            "Warn about common mistakes",
            "Provide clear next steps"
        ]
    ),
    Persona.INVESTOR: PersonaConfig(
        name="Nhà đầu tư",
        style="analytical, data-driven, comparative",
        tone="professional, objective, numbers-focused",
        sections=[
            "Tổng quan đầu tư",
            "Phân tích cơ hội",
            "Đánh giá rủi ro",
            "So sánh với alternatives",
            "Khuyến nghị"
        ],
        priorities=[
            "Focus on financial metrics",
            "Compare with benchmarks",
            "Quantify risks and returns",
            "Provide investment thesis"
        ]
    ),
    Persona.LEGAL_PROFESSIONAL: PersonaConfig(
        name="Chuyên gia pháp lý",
        style="precise, citation-heavy, comprehensive",
        tone="formal, authoritative, technical",
        sections=[
            "Cơ sở pháp lý",
            "Điều khoản liên quan",
            "Phân tích pháp lý",
            "Lưu ý thực thi",
            "Tiền lệ tham khảo"
        ],
        priorities=[
            "Cite specific laws and articles",
            "Provide legal interpretation",
            "Note compliance requirements",
            "Reference precedents"
        ]
    ),
    Persona.STUDENT: PersonaConfig(
        name="Sinh viên/Nghiên cứu",
        style="educational, structured, explanatory",
        tone="friendly, informative, pedagogical",
        sections=[
            "Khái niệm cơ bản",
            "Giải thích chi tiết",
            "Ví dụ minh họa",
            "Điểm cần nhớ",
            "Đọc thêm"
        ],
        priorities=[
            "Explain concepts clearly",
            "Provide examples",
            "Build from basics",
            "Suggest further reading"
        ]
    ),
    Persona.GENERAL: PersonaConfig(
        name="Người dùng chung",
        style="balanced, clear, helpful",
        tone="professional, friendly",
        sections=[
            "Tóm tắt",
            "Chi tiết",
            "Kết luận"
        ],
        priorities=[
            "Be clear and concise",
            "Cover main points",
            "Provide useful summary"
        ]
    )
}


def build_rewrite_prompt(
    original_answer: str,
    persona_config: PersonaConfig,
    query: str
) -> str:
    """Build prompt for rewriting answer to match persona."""
    
    sections_str = "\n".join(f"- {s}" for s in persona_config.sections)
    priorities_str = "\n".join(f"- {p}" for p in persona_config.priorities)
    
    return f"""Bạn là chuyên gia tư vấn tài chính-pháp lý Việt Nam. Hãy viết lại câu trả lời dưới đây theo phong cách phù hợp cho {persona_config.name}.

## Câu hỏi gốc:
{query}

## Câu trả lời cần viết lại:
{original_answer}

## Yêu cầu về phong cách:
- Phong cách: {persona_config.style}
- Giọng điệu: {persona_config.tone}

## Cấu trúc mong muốn (có thể linh hoạt):
{sections_str}

## Ưu tiên:
{priorities_str}

## Quy tắc BẮT BUỘC:
1. GIỮ NGUYÊN tất cả citation [1], [2], [3]... - KHÔNG được xóa hoặc thay đổi số
2. KHÔNG thêm thông tin mới không có trong câu trả lời gốc
3. Nếu có thông tin không đủ, THỪA NHẬN điều đó thay vì bịa ra
4. Kết thúc bằng "---" và liệt kê nguồn tham khảo nếu có

## Câu trả lời đã viết lại:
"""


@dataclass
class RewriteResult:
    """Result of persona-based rewriting."""
    original_answer: str
    rewritten_answer: str
    persona: Persona
    latency_ms: float
    success: bool
    
    def to_dict(self) -> dict:
        return {
            "original_answer": self.original_answer,
            "rewritten_answer": self.rewritten_answer,
            "persona": self.persona.value,
            "latency_ms": round(self.latency_ms, 2),
            "success": self.success
        }


class PersonaRewriter:
    """
    Rewrite grounded answers for specific user personas.
    
    Transforms academic/legal style answers into persona-appropriate
    consulting/actionable format while strictly preserving citations.
    
    Example:
        >>> rewriter = PersonaRewriter()
        >>> result = rewriter.rewrite(
        ...     answer="Luật Kinh doanh BĐS quy định... [1]",
        ...     query="Tư vấn về kinh doanh BĐS",
        ...     persona=Persona.STARTUP_FOUNDER
        ... )
        >>> print(result.rewritten_answer)
    """
    
    def __init__(self, model_name: Optional[str] = None):
        """Initialize with optional model override."""
        self.model_name = model_name or os.getenv(
            "GEMINI_MODEL", 
            "gemini-2.0-flash-exp"
        )
        self._model = None
    
    @property
    def model(self):
        """Lazy-load Gemini client."""
        if self._model is None and GEMINI_AVAILABLE:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                self._model = genai.Client(api_key=api_key)
        return self._model
    
    def detect_persona(self, query: str) -> Persona:
        """
        Auto-detect appropriate persona from query.
        
        Args:
            query: User's original question
            
        Returns:
            Detected persona enum value
        """
        query_lower = query.lower()
        
        # Startup/Entrepreneur keywords
        startup_keywords = [
            "khởi nghiệp", "startup", "doanh nhân", "thành lập công ty",
            "mở doanh nghiệp", "kinh doanh", "mô hình", "phát triển"
        ]
        if any(kw in query_lower for kw in startup_keywords):
            return Persona.STARTUP_FOUNDER
        
        # Investor keywords
        investor_keywords = [
            "đầu tư", "investor", "cổ phiếu", "lợi nhuận", "roi",
            "p/e", "định giá", "portfolio", "rủi ro đầu tư"
        ]
        if any(kw in query_lower for kw in investor_keywords):
            return Persona.INVESTOR
        
        # Legal keywords
        legal_keywords = [
            "luật", "pháp lý", "quy định", "điều", "khoản",
            "nghị định", "thông tư", "tuân thủ", "compliance"
        ]
        if any(kw in query_lower for kw in legal_keywords):
            return Persona.LEGAL_PROFESSIONAL
        
        # Student keywords
        student_keywords = [
            "là gì", "giải thích", "học", "nghiên cứu", "khái niệm",
            "định nghĩa", "ví dụ", "em muốn biết"
        ]
        if any(kw in query_lower for kw in student_keywords):
            return Persona.STUDENT
        
        return Persona.GENERAL
    
    def rewrite(
        self,
        answer: str,
        query: str,
        persona: Optional[Persona] = None,
        auto_detect: bool = True
    ) -> RewriteResult:
        """
        Rewrite answer for target persona.
        
        Args:
            answer: Original grounded answer with citations
            query: User's original question
            persona: Target persona (auto-detected if None)
            auto_detect: Whether to auto-detect persona from query
            
        Returns:
            RewriteResult with original and rewritten answers
        """
        start = time.time()
        
        # Determine persona
        if persona is None and auto_detect:
            persona = self.detect_persona(query)
        elif persona is None:
            persona = Persona.GENERAL
        
        persona_config = PERSONA_CONFIGS[persona]
        
        # Check if rewriting is needed
        if persona == Persona.GENERAL:
            # No rewriting needed for general persona
            return RewriteResult(
                original_answer=answer,
                rewritten_answer=answer,
                persona=persona,
                latency_ms=(time.time() - start) * 1000,
                success=True
            )
        
        # Check model availability
        if not self.model:
            logger.warning("Gemini model not available, returning original answer")
            return RewriteResult(
                original_answer=answer,
                rewritten_answer=answer,
                persona=persona,
                latency_ms=(time.time() - start) * 1000,
                success=False
            )
        
        try:
            # Build and execute rewrite prompt
            prompt = build_rewrite_prompt(answer, persona_config, query)
            
            config = types.GenerateContentConfig(
                temperature=0.4,  # Slightly creative but focused
                max_output_tokens=2048
            )
            
            response = self.model.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            rewritten = response.text.strip()
            
            # Validate citations are preserved
            original_citations = set(re.findall(r'\[(\d+)\]', answer))
            rewritten_citations = set(re.findall(r'\[(\d+)\]', rewritten))
            
            if original_citations and not rewritten_citations:
                logger.warning("Citations lost during rewriting, returning original")
                return RewriteResult(
                    original_answer=answer,
                    rewritten_answer=answer,
                    persona=persona,
                    latency_ms=(time.time() - start) * 1000,
                    success=False
                )
            
            return RewriteResult(
                original_answer=answer,
                rewritten_answer=rewritten,
                persona=persona,
                latency_ms=(time.time() - start) * 1000,
                success=True
            )
            
        except Exception as e:
            logger.error(f"Rewrite error: {e}")
            return RewriteResult(
                original_answer=answer,
                rewritten_answer=answer,
                persona=persona,
                latency_ms=(time.time() - start) * 1000,
                success=False
            )
    
    def rewrite_for_startup(self, answer: str, query: str) -> RewriteResult:
        """Convenience method for startup founder persona."""
        return self.rewrite(answer, query, Persona.STARTUP_FOUNDER)
    
    def rewrite_for_investor(self, answer: str, query: str) -> RewriteResult:
        """Convenience method for investor persona."""
        return self.rewrite(answer, query, Persona.INVESTOR)
    
    def rewrite_for_legal(self, answer: str, query: str) -> RewriteResult:
        """Convenience method for legal professional persona."""
        return self.rewrite(answer, query, Persona.LEGAL_PROFESSIONAL)
