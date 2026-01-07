"""
News Response Schemas.

Pydantic models for news endpoint responses.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class TickerInfo(BaseModel):
    """Stock ticker associated with news."""
    ticker: str = Field(..., description="Stock ticker symbol (e.g., VNM, HPG)")
    confidence: Optional[float] = Field(None, description="Detection confidence score")


class NewsItem(BaseModel):
    """Single news article."""
    news_id: str = Field(..., description="Unique news ID")
    title: str = Field(..., description="News title")
    content: Optional[str] = Field(None, description="News content/snippet")
    source_url: Optional[str] = Field(None, description="Original source URL")
    published_at: Optional[str] = Field(None, description="Publication timestamp")
    sentiment: Optional[str] = Field(None, description="Sentiment: positive/negative/neutral")
    tickers: List[TickerInfo] = Field(default=[], description="Related stock tickers")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "news_id": "550e8400-e29b-41d4-a716-446655440000",
                    "title": "VNM báo cáo lợi nhuận quý 4 tăng 15%",
                    "content": "Vinamilk công bố kết quả kinh doanh quý 4...",
                    "source_url": "https://cafef.vn/vnm-bao-cao-loi-nhuan.html",
                    "published_at": "2026-01-07T10:00:00Z",
                    "sentiment": "positive",
                    "tickers": [
                        {"ticker": "VNM", "confidence": 0.95}
                    ]
                }
            ]
        }
    }


class NewsListResponse(BaseModel):
    """Response for listing news articles."""
    news: List[NewsItem] = Field(..., description="List of news articles")
    total: int = Field(..., description="Total number of articles")
    page: int = Field(default=1, description="Current page number")
    page_size: int = Field(default=10, description="Items per page")
    has_next: bool = Field(default=False, description="Whether more pages exist")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "news": [
                        {
                            "news_id": "550e8400-e29b-41d4-a716-446655440000",
                            "title": "VNM báo cáo lợi nhuận quý 4 tăng 15%",
                            "source_url": "https://cafef.vn/vnm-bao-cao-loi-nhuan.html",
                            "sentiment": "positive",
                            "tickers": [{"ticker": "VNM", "confidence": 0.95}]
                        }
                    ],
                    "total": 100,
                    "page": 1,
                    "page_size": 10,
                    "has_next": True
                }
            ]
        }
    }


class NewsDetailResponse(BaseModel):
    """Response for single news article detail."""
    news: NewsItem = Field(..., description="News article details")
    related_news: List[NewsItem] = Field(default=[], description="Related news articles")
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "news": {
                        "news_id": "550e8400-e29b-41d4-a716-446655440000",
                        "title": "VNM báo cáo lợi nhuận quý 4 tăng 15%",
                        "content": "Vinamilk công bố kết quả kinh doanh quý 4...",
                        "source_url": "https://cafef.vn/vnm-bao-cao-loi-nhuan.html",
                        "published_at": "2026-01-07T10:00:00Z",
                        "sentiment": "positive",
                        "tickers": [{"ticker": "VNM", "confidence": 0.95}]
                    },
                    "related_news": []
                }
            ]
        }
    }


class NewsByTickerResponse(BaseModel):
    """Response for news filtered by stock ticker."""
    ticker: str = Field(..., description="Stock ticker symbol")
    news: List[NewsItem] = Field(..., description="News articles for this ticker")
    total: int = Field(..., description="Total articles for this ticker")
    sentiment_summary: Optional[dict] = Field(
        None, 
        description="Sentiment breakdown (positive/negative/neutral counts)"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "ticker": "VNM",
                    "news": [
                        {
                            "news_id": "550e8400-e29b-41d4-a716-446655440000",
                            "title": "VNM báo cáo lợi nhuận quý 4 tăng 15%",
                            "source_url": "https://cafef.vn/vnm-bao-cao-loi-nhuan.html",
                            "sentiment": "positive",
                            "tickers": [{"ticker": "VNM", "confidence": 0.95}]
                        }
                    ],
                    "total": 25,
                    "sentiment_summary": {
                        "positive": 15,
                        "negative": 5,
                        "neutral": 5
                    }
                }
            ]
        }
    }


class SentimentStats(BaseModel):
    """Overall sentiment statistics."""
    positive: int = Field(default=0, description="Count of positive news")
    negative: int = Field(default=0, description="Count of negative news")
    neutral: int = Field(default=0, description="Count of neutral news")
    total: int = Field(default=0, description="Total news analyzed")


class NewsStatsResponse(BaseModel):
    """Response for news statistics endpoint."""
    total_news: int = Field(..., description="Total news articles in database")
    sentiment_stats: SentimentStats = Field(..., description="Sentiment breakdown")
    top_tickers: List[dict] = Field(
        default=[], 
        description="Most mentioned tickers with counts"
    )
    latest_crawl_at: Optional[datetime] = Field(
        None, 
        description="Timestamp of last crawl"
    )
    
    model_config = {
        "json_schema_extra": {
            "examples": [
                {
                    "total_news": 1500,
                    "sentiment_stats": {
                        "positive": 600,
                        "negative": 400,
                        "neutral": 500,
                        "total": 1500
                    },
                    "top_tickers": [
                        {"ticker": "VNM", "count": 150},
                        {"ticker": "HPG", "count": 120},
                        {"ticker": "VCB", "count": 100}
                    ],
                    "latest_crawl_at": "2026-01-07T12:00:00Z"
                }
            ]
        }
    }
