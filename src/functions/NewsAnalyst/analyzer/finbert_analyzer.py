"""
FinBERT sentiment analyzer for English financial text.

Uses ProsusAI/finbert model for sentiment classification:
- positive
- negative  
- neutral
"""
import logging
from typing import Dict, List
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


class FinBERTAnalyzer:
    """
    FinBERT-based sentiment analyzer for English financial text.
    
    Model: ProsusAI/finbert
    Output: positive, negative, neutral with confidence scores
    """
    
    def __init__(self, config: NewsAnalystConfig):
        """
        Initialize FinBERT analyzer.
        
        Args:
            config: NewsAnalystConfig instance
        """
        self.config = config
        self.model_name = config.finbert_model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        logger.info(f"Loading FinBERT model: {self.model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.model = AutoModelForSequenceClassification.from_pretrained(self.model_name)
        self.model.to(self.device)
        self.model.eval()
        
        self.labels = ["positive", "negative", "neutral"]
        logger.info(f"FinBERT loaded on {self.device}")
    
    def analyze(self, text: str) -> Dict[str, any]:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze (English)
            
        Returns:
            Dictionary with sentiment, confidence, and scores
        """
        # Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=512,
            padding=True
        ).to(self.device)
        
        # Predict
        with torch.no_grad():
            outputs = self.model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
        
        # Get results
        scores = predictions[0].cpu().numpy()
        sentiment_idx = scores.argmax()
        sentiment = self.labels[sentiment_idx]
        confidence = float(scores[sentiment_idx])
        
        return {
            "sentiment": sentiment,
            "confidence": confidence,
            "scores": {
                "positive": float(scores[0]),
                "negative": float(scores[1]),
                "neutral": float(scores[2])
            }
        }
    
    def analyze_batch(self, texts: List[str]) -> List[Dict[str, any]]:
        """
        Analyze sentiment of multiple texts.
        
        Args:
            texts: List of texts to analyze
            
        Returns:
            List of sentiment dictionaries
        """
        results = []
        batch_size = self.config.sentiment_batch_size
        
        for i in range(0, len(texts), batch_size):
            batch = texts[i:i + batch_size]
            
            # Tokenize batch
            inputs = self.tokenizer(
                batch,
                return_tensors="pt",
                truncation=True,
                max_length=512,
                padding=True
            ).to(self.device)
            
            # Predict batch
            with torch.no_grad():
                outputs = self.model(**inputs)
                predictions = torch.nn.functional.softmax(outputs.logits, dim=-1)
            
            # Parse results
            for j, pred in enumerate(predictions):
                scores = pred.cpu().numpy()
                sentiment_idx = scores.argmax()
                
                results.append({
                    "sentiment": self.labels[sentiment_idx],
                    "confidence": float(scores[sentiment_idx]),
                    "scores": {
                        "positive": float(scores[0]),
                        "negative": float(scores[1]),
                        "neutral": float(scores[2])
                    }
                })
        
        logger.info(f"Analyzed {len(texts)} texts with FinBERT")
        return results
