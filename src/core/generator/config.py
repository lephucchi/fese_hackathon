"""
Configuration for Grounded Generator.
"""
import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()


def _get_gemini_model() -> str:
    """Get Gemini model from environment, raise if not set."""
    model = os.getenv("GEMINI_MODEL", "")
    if not model:
        raise ValueError("GEMINI_MODEL environment variable is not set")
    return model


@dataclass(frozen=True)
class GeneratorConfig:
    """
    Configuration for GroundedGenerator.
    
    Attributes:
        model_name: Gemini model to use
        temperature: LLM temperature (lower = more deterministic)
        max_tokens: Maximum output tokens
        citation_format: Format for inline citations
        require_grounding: Require all claims to have citations
        language: Output language
    """
    model_name: str = field(default_factory=_get_gemini_model)
    temperature: float = 0.3
    max_tokens: int = 2048
    citation_format: str = "[{n}]"
    require_grounding: bool = True
    language: str = "vi"
    
    @classmethod
    def from_env(cls) -> "GeneratorConfig":
        """Create config from environment variables."""
        return cls(
            model_name=_get_gemini_model(),
            temperature=float(os.getenv("GEN_TEMPERATURE", "0.3")),
            max_tokens=int(os.getenv("GEN_MAX_TOKENS", "2048")),
        )
