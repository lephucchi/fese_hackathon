"""
Generator Module - Grounded Answer Generation with Citations.

Provides LLM-based answer generation strictly grounded in retrieved context.
Updated for Canonical Answer Framework (CAF) - Step 8.

All config from environment variables (.env).
All prompts centralized in prompts.py.
"""
from .config import GeneratorConfig
from .grounded import GroundedGenerator, GenerationResult
from .prompts import (
    # Original prompts
    GROUNDED_GENERATION_SYSTEM,
    GROUNDED_GENERATION_USER,
    build_generation_prompt,
    # CAF prompts
    CAF_EXTRACTION_SYSTEM,
    CAF_EXTRACTION_USER,
    CAF_SYNTHESIS_SYSTEM,
    CAF_SYNTHESIS_USER,
    CANONICAL_ANSWER_STRUCTURE,
    build_caf_extraction_prompt,
    build_caf_synthesis_prompt,
)
from .persona_rewriter import PersonaRewriter, Persona, RewriteResult, PERSONA_CONFIGS

# CAF - Canonical Answer Framework
from .canonical_types import (
    CanonicalFact,
    CanonicalFactList,
    FactDomain,
    FactType,
    Relevance
)
from .fact_extractor import CanonicalFactExtractor
from .answer_synthesizer import CanonicalAnswerSynthesizer

__all__ = [
    # Config
    "GeneratorConfig",
    # Original Generation
    "GroundedGenerator",
    "GenerationResult",
    "GROUNDED_GENERATION_SYSTEM",
    "build_generation_prompt",
    # Persona Rewriter
    "PersonaRewriter",
    "Persona",
    "RewriteResult",
    "PERSONA_CONFIGS",
    # CAF Types
    "CanonicalFact",
    "CanonicalFactList",
    "FactDomain",
    "FactType",
    "Relevance",
    # CAF Prompts
    "CANONICAL_ANSWER_STRUCTURE",
    "build_caf_extraction_prompt",
    "build_caf_synthesis_prompt",
    # CAF Components
    "CanonicalFactExtractor",
    "CanonicalAnswerSynthesizer",
]
