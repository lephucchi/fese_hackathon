"""
News routes - News API endpoints.

Provides endpoints for fetching news articles from database.
Flow: Routes → Services → Repositories
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from ..schemas.responses import (
    NewsListResponse,
    NewsDetailResponse,
    NewsByTickerResponse,
    NewsStatsResponse,
    NewsItem,
    TickerInfo,
    SentimentStats,
    ErrorResponse,
)
from ..services.news_service import NewsService
from ..repositories.news_repository import NewsRepository
from ..dependencies import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["News"], prefix="/news")


def get_news_repository(
    supabase=Depends(get_supabase_client)
) -> NewsRepository:
    """Dependency to get NewsRepository instance."""
    return NewsRepository(supabase)


def get_news_service(
    news_repo: NewsRepository = Depends(get_news_repository)
) -> NewsService:
    """Dependency to get NewsService instance."""
    return NewsService(news_repo)


@router.get(
    "",
    response_model=NewsListResponse,
    responses={
        200: {"description": "List of news articles"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Get all news articles",
    description="""
    Retrieve news articles with pagination and optional filters.
    
    - **page**: Page number (default: 1)
    - **page_size**: Items per page (default: 10, max: 100)
    - **sentiment**: Filter by sentiment (positive/negative/neutral)
    """
)
async def get_news_list(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    sentiment: Optional[str] = Query(default=None, description="Filter by sentiment"),
    news_service: NewsService = Depends(get_news_service)
):
    """Get paginated list of news articles."""
    try:
        result = await news_service.get_news_list(
            page=page,
            page_size=page_size,
            sentiment=sentiment
        )
        
        news_items = [_build_news_item(item) for item in result["news"]]
        
        return NewsListResponse(
            news=news_items,
            total=result["total"],
            page=result["page"],
            page_size=result["page_size"],
            has_next=result["has_next"]
        )
        
    except Exception as e:
        logger.error(f"Error fetching news list: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "fetch_error", "message": str(e)}
        )


@router.get(
    "/stats",
    response_model=NewsStatsResponse,
    responses={
        200: {"description": "News statistics"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Get news statistics",
    description="Get overall statistics including sentiment breakdown and top tickers."
)
async def get_news_stats(
    news_service: NewsService = Depends(get_news_service)
):
    """Get news statistics and analytics."""
    try:
        result = await news_service.get_news_stats()
        
        return NewsStatsResponse(
            total_news=result["total_news"],
            sentiment_stats=SentimentStats(**result["sentiment_stats"]),
            top_tickers=result["top_tickers"],
            latest_crawl_at=result["latest_crawl_at"]
        )
        
    except Exception as e:
        logger.error(f"Error fetching news stats: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "stats_error", "message": str(e)}
        )


@router.get(
    "/ticker/{ticker}",
    response_model=NewsByTickerResponse,
    responses={
        200: {"description": "News for specific ticker"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Get news by stock ticker",
    description="Get news articles related to a specific stock ticker symbol."
)
async def get_news_by_ticker(
    ticker: str,
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=10, ge=1, le=100, description="Items per page"),
    news_service: NewsService = Depends(get_news_service)
):
    """Get news articles for a specific stock ticker."""
    try:
        result = await news_service.get_news_by_ticker(
            ticker=ticker,
            page=page,
            page_size=page_size
        )
        
        news_items = [_build_news_item(item) for item in result["news"]]
        
        return NewsByTickerResponse(
            ticker=result["ticker"],
            news=news_items,
            total=result["total"],
            sentiment_summary=result["sentiment_summary"]
        )
        
    except Exception as e:
        logger.error(f"Error fetching news for ticker {ticker}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "fetch_error", "message": str(e)}
        )


@router.get(
    "/{news_id}",
    response_model=NewsDetailResponse,
    responses={
        200: {"description": "News article details"},
        404: {"model": ErrorResponse, "description": "News not found"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Get news article by ID",
    description="Get detailed information about a specific news article."
)
async def get_news_detail(
    news_id: str,
    news_service: NewsService = Depends(get_news_service)
):
    """Get single news article by ID."""
    try:
        news_data = await news_service.get_news_by_id(news_id)
        
        if not news_data:
            raise HTTPException(
                status_code=404,
                detail={"error": "not_found", "message": f"News {news_id} not found"}
            )
        
        news_item = _build_news_item(news_data)
        
        return NewsDetailResponse(
            news=news_item,
            related_news=[]  # TODO: Implement related news logic
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching news {news_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "fetch_error", "message": str(e)}
        )


def _build_news_item(data: dict) -> NewsItem:
    """
    Build NewsItem from database data.
    
    Args:
        data: Raw news data from service
        
    Returns:
        NewsItem Pydantic model
    """
    tickers = []
    if "tickers" in data and data["tickers"]:
        tickers = [TickerInfo(**t) for t in data["tickers"]]
    
    return NewsItem(
        news_id=data["news_id"],
        title=data.get("title", ""),
        content=data.get("content"),
        source_url=data.get("source_url"),
        published_at=data.get("published_at"),
        sentiment=data.get("sentiment"),
        analyst=data.get("analyst"),
        tickers=tickers
    )

