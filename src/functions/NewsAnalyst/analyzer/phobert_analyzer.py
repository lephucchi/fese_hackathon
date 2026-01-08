"""
PhoBERT sentiment analyzer for Vietnamese text.

Uses pre-trained Vietnamese sentiment model (wonrax/phobert-base-vietnamese-sentiment).
Simple, clean implementation following coding best practices.
"""
import logging
import re
from typing import Dict, List, Optional
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


class PhoBERTAnalyzer:
    """
    PhoBERT-based sentiment analyzer for Vietnamese text.
    
    Uses wonrax/phobert-base-vietnamese-sentiment - a model already fine-tuned
    for Vietnamese sentiment analysis. No hardcoded keywords needed.
    
    Output: positive, negative, neutral with confidence scores
    """
    
    def __init__(self, config: NewsAnalystConfig):
        """Initialize PhoBERT analyzer with pre-trained sentiment model."""
        self.config = config
        self.device = self._get_device()
        self.model_name = "wonrax/phobert-base-vietnamese-sentiment"
        
        self.tokenizer: Optional[AutoTokenizer] = None
        self.model: Optional[AutoModelForSequenceClassification] = None
        self.model_loaded = False
        
        self._load_model()
    
    def _get_device(self) -> str:
        """Determine the best available device."""
        if torch.cuda.is_available():
            return "cuda"
        return "cpu"
    
    def _load_model(self) -> None:
        """Load the pre-trained sentiment model with error handling."""
        logger.info(f"Loading sentiment model: {self.model_name}")
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
            self.model = AutoModelForSequenceClassification.from_pretrained(
                self.model_name
            )
            self.model.to(self.device)
            self.model.eval()
            self.model_loaded = True
            logger.info(f"Model loaded successfully on {self.device}")
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            self.model_loaded = False
    
    def _preprocess(self, text: str) -> str:
        """
        Clean and normalize text before analysis.
        
        Removes noise while preserving sentiment-bearing content.
        """
        if not text:
            return ""
        
        # Remove URLs
        text = re.sub(r'https?://\S+|www\.\S+', '', text)
        
        # Remove email addresses
        text = re.sub(r'\S+@\S+', '', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text).strip()
        
        return text
    
    def _get_default_result(self) -> Dict[str, any]:
        """Return neutral result for empty or invalid input."""
        return {
            "sentiment": "neutral",
            "confidence": 0.5,
            "scores": {
                "positive": 0.33,
                "negative": 0.33,
                "neutral": 0.34
            }
        }
    
    def _predict(self, text: str) -> Dict[str, float]:
        """
        Get raw prediction scores from model.
        
        Returns:
            Dictionary with positive, negative, neutral scores
        """
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=256,
            padding=True
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        scores = probs[0].cpu().numpy()
        
        # wonrax model mapping: 0=negative, 1=positive, 2=neutral
        return {
            "positive": float(scores[1]),
            "negative": float(scores[0]),
            "neutral": float(scores[2])
        }
    
    def _calculate_confidence(self, scores: Dict[str, float]) -> float:
        """
        Calculate confidence based on score distribution.
        
        Higher confidence when one sentiment clearly dominates.
        Lower confidence when scores are close together.
        """
        values = list(scores.values())
        max_score = max(values)
        second_max = sorted(values)[-2]
        
        # Confidence increases when gap between top two is larger
        margin = max_score - second_max
        
        # Scale: margin of 0 -> 0.5 confidence, margin of 0.5+ -> ~0.95 confidence
        confidence = 0.5 + (margin * 0.9)
        
        return min(confidence, 0.99)
    
    def analyze(self, text: str) -> Dict[str, any]:
        """
        Analyze sentiment of Vietnamese text.
        
        Args:
            text: Vietnamese text to analyze
            
        Returns:
            Dictionary with sentiment, confidence, and scores
        """
        # Validate model is loaded
        if not self.model_loaded:
            logger.warning("Model not loaded, returning default result")
            return self._get_default_result()
        
        # Preprocess
        processed_text = self._preprocess(text)
        if not processed_text:
            return self._get_default_result()
        
        # Get model predictions
        scores = self._predict(processed_text)
        
        # Determine sentiment and confidence
        sentiment = max(scores, key=scores.get)
        confidence = self._calculate_confidence(scores)
        
        return {
            "sentiment": sentiment,
            "confidence": round(confidence, 4),
            "scores": {k: round(v, 4) for k, v in scores.items()}
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, any]]:
        """
        Analyze sentiment of multiple Vietnamese texts.
        
        Args:
            texts: List of Vietnamese texts
            
        Returns:
            List of sentiment dictionaries
        """
        if not self.model_loaded:
            logger.warning("Model not loaded, returning default results")
            return [self._get_default_result() for _ in texts]
        
        results = []
        batch_size = self.config.sentiment_batch_size
        
        for i in range(0, len(texts), batch_size):
            batch_results = self._analyze_batch_chunk(texts[i:i + batch_size])
            results.extend(batch_results)
        
        logger.info(f"Analyzed {len(texts)} Vietnamese texts")
        return results
    
    def _analyze_batch_chunk(self, texts: List[str]) -> List[Dict[str, any]]:
        """Process a single batch chunk."""
        # Preprocess all texts
        processed = [self._preprocess(t) for t in texts]
        
        # Track which texts are valid
        valid_indices = [i for i, t in enumerate(processed) if t]
        valid_texts = [processed[i] for i in valid_indices]
        
        # Initialize results with defaults
        results = [self._get_default_result() for _ in texts]
        
        if not valid_texts:
            return results
        
        # Batch tokenization and prediction
        inputs = self.tokenizer(
            valid_texts,
            return_tensors="pt",
            truncation=True,
            max_length=256,
            padding=True
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model(**inputs)
            probs = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Process each prediction
        for idx, orig_idx in enumerate(valid_indices):
            scores_arr = probs[idx].cpu().numpy()
            
            # Map scores (0=neg, 1=pos, 2=neutral)
            scores = {
                "positive": float(scores_arr[1]),
                "negative": float(scores_arr[0]),
                "neutral": float(scores_arr[2])
            }
            
            sentiment = max(scores, key=scores.get)
            confidence = self._calculate_confidence(scores)
            
            results[orig_idx] = {
                "sentiment": sentiment,
                "confidence": round(confidence, 4),
                "scores": {k: round(v, 4) for k, v in scores.items()}
            }
        
        return results

