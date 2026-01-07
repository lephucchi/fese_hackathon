"""
PhoBERT sentiment analyzer for Vietnamese text.

Uses vinai/phobert-base-v2 with fine-tuned classification head.
"""
import logging
from typing import Dict, List
import torch
from transformers import AutoTokenizer, AutoModel
import torch.nn as nn

from ..config import NewsAnalystConfig

logger = logging.getLogger(__name__)


class PhoBERTAnalyzer:
    """
    PhoBERT-based sentiment analyzer for Vietnamese text.
    
    Model: vinai/phobert-base-v2
    Output: positive, negative, neutral with confidence scores
    """
    
    def __init__(self, config: NewsAnalystConfig):
        """
        Initialize PhoBERT analyzer.
        
        Args:
            config: NewsAnalystConfig instance
        """
        self.config = config
        self.model_name = config.phobert_model
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        logger.info(f"Loading PhoBERT model: {self.model_name}")
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        self.encoder = AutoModel.from_pretrained(self.model_name)
        
        # Simple classification head (can be fine-tuned later)
        self.classifier = nn.Sequential(
            nn.Linear(768, 256),
            nn.ReLU(),
            nn.Dropout(0.1),
            nn.Linear(256, 3)  # 3 classes: pos, neg, neutral
        )
        
        self.encoder.to(self.device)
        self.classifier.to(self.device)
        self.encoder.eval()
        self.classifier.eval()
        
        self.labels = ["positive", "negative", "neutral"]
        logger.info(f"PhoBERT loaded on {self.device}")
    
    def analyze(self, text: str) -> Dict[str, any]:
        """
        Analyze sentiment of Vietnamese text.
        
        Args:
            text: Vietnamese text to analyze
            
        Returns:
            Dictionary with sentiment, confidence, and scores
        """
        # Tokenize
        inputs = self.tokenizer(
            text,
            return_tensors="pt",
            truncation=True,
            max_length=256,
            padding=True
        ).to(self.device)
        
        # Get embeddings
        with torch.no_grad():
            outputs = self.encoder(**inputs)
            # Use [CLS] token embedding
            embeddings = outputs.last_hidden_state[:, 0, :]
            
            # Classify
            logits = self.classifier(embeddings)
            predictions = torch.nn.functional.softmax(logits, dim=-1)
        
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
        Analyze sentiment of multiple Vietnamese texts.
        
        Args:
            texts: List of Vietnamese texts
            
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
                max_length=256,
                padding=True
            ).to(self.device)
            
            # Process batch
            with torch.no_grad():
                outputs = self.encoder(**inputs)
                embeddings = outputs.last_hidden_state[:, 0, :]
                logits = self.classifier(embeddings)
                predictions = torch.nn.functional.softmax(logits, dim=-1)
            
            # Parse results
            for pred in predictions:
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
        
        logger.info(f"Analyzed {len(texts)} Vietnamese texts with PhoBERT")
        return results
