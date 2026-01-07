"""
Interaction Response Schemas.

Pydantic models for user interaction endpoint responses.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

from .news import NewsItem


class InteractionResponse(BaseModel):
    """Response for creating interaction."""
    message: str = Field(..., description="Response message")
    interaction_id: str = Field(..., description="Created interaction ID")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "message": "Interaction saved",
                    "interaction_id": "550e8400-e29b-41d4-a716-446655440000"
                }
            ]
        }
    }


class UserInterestsResponse(BaseModel):
    """Response for user's interested news with analyst content."""
    news: List[NewsItem] = Field(..., description="List of interested news with analyst")
    total: int = Field(..., description="Total interested news")
    has_analysis: int = Field(default=0, description="Count of news with analyst content")
    missing_analysis: int = Field(default=0, description="Count of news without analyst")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "news": [
                        {
                            "news_id": "550e8400-e29b-41d4-a716-446655440000",
                            "title": "VNM báo cáo lợi nhuận tăng 15%",
                            "analyst": {"summary": "Phân tích tích cực..."},
                            "sentiment": "positive",
                            "tickers": [{"ticker": "VNM"}]
                        }
                    ],
                    "total": 5,
                    "has_analysis": 4,
                    "missing_analysis": 1
                }
            ]
        }
    }
