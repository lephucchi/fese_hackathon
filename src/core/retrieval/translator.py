"""
Query Translator for Cross-lingual Retrieval.

Translates Vietnamese queries to English when retrieving from English-only indices.
Uses Gemini API for translation.
"""
import os
import logging
from typing import Optional
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Optional Gemini import
try:
    from google import genai
    from google.genai import types
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    logger.warning("google-genai not installed. Query translation disabled.")


class QueryTranslator:
    """
    Translates queries between languages for cross-lingual retrieval.
    
    Used when query language differs from index language (e.g., Vietnamese query
    against English glossary).
    
    Example:
        >>> translator = QueryTranslator()
        >>> translator.translate("ROE là gì?", target_lang="en")
        "What is ROE?"
    """
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize translator with Gemini model.
        
        Args:
            model_name: Gemini model to use (default from env GEMINI_MODEL)
        """
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "")
        self._client = None
        
        if GEMINI_AVAILABLE and self.model_name:
            api_key = os.getenv("GEMINI_API_KEY")
            if api_key:
                self._client = genai.Client(api_key=api_key)
                self._config = types.GenerateContentConfig(
                    temperature=0.1,
                    max_output_tokens=256
                )
    
    @property
    def is_available(self) -> bool:
        """Check if translator is available."""
        return self._client is not None
    
    def translate(
        self, 
        query: str, 
        source_lang: str = "vi",
        target_lang: str = "en"
    ) -> str:
        """
        Translate query from source to target language.
        
        Args:
            query: Query text to translate
            source_lang: Source language code (vi, en)
            target_lang: Target language code (vi, en)
            
        Returns:
            Translated query, or original if translation fails
        """
        if not self.is_available:
            logger.warning("Translator not available, returning original query")
            return query
        
        if source_lang == target_lang:
            return query
        
        # Check cache first
        cached = self._get_cached(query, target_lang)
        if cached:
            return cached
        
        try:
            lang_names = {"vi": "Vietnamese", "en": "English"}
            source_name = lang_names.get(source_lang, source_lang)
            target_name = lang_names.get(target_lang, target_lang)
            
            prompt = f"""Translate the following {source_name} query to {target_name}.
Keep technical/financial terms unchanged (like ROE, P/E, EPS).
Only return the translated text, nothing else.

Query: {query}

Translation:"""
            
            response = self._client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=self._config
            )
            translated = response.text.strip()
            
            # Cache the result
            self._cache_result(query, target_lang, translated)
            
            logger.info(f"[TRANSLATE] '{query}' -> '{translated}'")
            return translated
            
        except Exception as e:
            logger.error(f"Translation failed: {e}")
            return query
    
    def translate_for_index(
        self, 
        query: str, 
        index: str
    ) -> str:
        """
        Translate query if needed for specific index.
        
        Args:
            query: Query text
            index: Target index name (glossary, financial, legal, news)
            
        Returns:
            Translated query for glossary index, original otherwise
        """
        # Glossary is English, others are Vietnamese
        if index == "glossary":
            # Detect if query is Vietnamese
            if self._is_vietnamese(query):
                return self.translate(query, source_lang="vi", target_lang="en")
        
        return query
    
    @staticmethod
    def _is_vietnamese(text: str) -> bool:
        """
        Detect if text is Vietnamese.
        
        Uses heuristic: check for Vietnamese-specific characters and common words.
        """
        vietnamese_chars = set("àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ")
        # Include words both with and without diacritics
        vietnamese_words = {
            # With diacritics
            "là", "và", "của", "có", "trong", "được", "để", "này", "với", 
            "cho", "không", "những", "các", "như", "bao", "nhiêu", "thế", 
            "nào", "gì", "sao", "tại", "đã", "còn", "hay", "hoặc",
            # Without diacritics (when user types without accents)
            "la", "va", "cua", "co", "trong", "duoc", "de", "nay", "voi",
            "cho", "khong", "nhung", "cac", "nhu", "bao", "nhieu", "the",
            "nao", "gi", "sao", "tai", "da", "con", "hay", "hoac",
            # Question words
            "gi", "nao", "sao", "dau", "bao"
        }
        
        text_lower = text.lower()
        
        # Check for Vietnamese characters
        if any(c in vietnamese_chars for c in text_lower):
            return True
        
        # Check for Vietnamese words
        words = set(text_lower.replace("?", " ").replace(".", " ").split())
        if words & vietnamese_words:
            return True
        
        return False
    
    # Simple in-memory cache
    _translation_cache = {}
    
    def _get_cached(self, query: str, target_lang: str) -> Optional[str]:
        """Get cached translation."""
        key = f"{query}_{target_lang}"
        return self._translation_cache.get(key)
    
    def _cache_result(self, query: str, target_lang: str, translated: str):
        """Cache translation result."""
        key = f"{query}_{target_lang}"
        # Limit cache size
        if len(self._translation_cache) > 1000:
            self._translation_cache.clear()
        self._translation_cache[key] = translated


# Singleton instance
_translator = None


def get_translator() -> QueryTranslator:
    """Get or create translator instance."""
    global _translator
    if _translator is None:
        _translator = QueryTranslator()
    return _translator


def translate_for_glossary(query: str) -> str:
    """
    Convenience function to translate query for glossary retrieval.
    
    Args:
        query: Vietnamese query
        
    Returns:
        English query for glossary search
    """
    translator = get_translator()
    return translator.translate_for_index(query, "glossary")
