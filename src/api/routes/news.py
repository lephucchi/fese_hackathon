"""
News routes - News API endpoints.

Provides endpoints for fetching news articles from database.
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
from ..repositories.news_repository import NewsRepository
from ..dependencies import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["News"], prefix="/news")


def get_news_repository(
    supabase=Depends(get_supabase_client)
) -> NewsRepository:
    """Dependency to get NewsRepository instance."""
    return NewsRepository(supabase)


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
    - **page_size**: Items per page (default: 20, max: 100)
    - **sentiment**: Filter by sentiment (positive/negative/neutral)
    """
)
async def get_news_list(
    page: int = Query(default=1, ge=1, description="Page number"),
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    sentiment: Optional[str] = Query(default=None, description="Filter by sentiment"),
    news_repo: NewsRepository = Depends(get_news_repository)
):
    """Get paginated list of news articles."""
    try:
        offset = (page - 1) * page_size
        
        # Get news articles
        news_data = await news_repo.find_all(
            limit=page_size,
            offset=offset,
            sentiment=sentiment
        )
        
        # Get total count
        filters = {"sentiment": sentiment} if sentiment else None
        total = await news_repo.count(filters)
        
        # Build response
        news_items = [_build_news_item(item) for item in news_data]
        has_next = offset + page_size < total
        
        return NewsListResponse(
            news=news_items,
            total=total,
            page=page,
            page_size=page_size,
            has_next=has_next
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
    news_repo: NewsRepository = Depends(get_news_repository)
):
    """Get news statistics and analytics."""
    try:
        total = await news_repo.count()
        sentiment_data = await news_repo.get_sentiment_stats()
        top_tickers = await news_repo.get_top_tickers(limit=10)
        
        return NewsStatsResponse(
            total_news=total,
            sentiment_stats=SentimentStats(**sentiment_data),
            top_tickers=top_tickers,
            latest_crawl_at=None  # TODO: Track last crawl time
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
    page_size: int = Query(default=20, ge=1, le=100, description="Items per page"),
    news_repo: NewsRepository = Depends(get_news_repository)
):
    """Get news articles for a specific stock ticker."""
    try:
        offset = (page - 1) * page_size
        ticker_upper = ticker.upper()
        
        # Get news for ticker
        news_data = await news_repo.find_by_ticker(
            ticker=ticker_upper,
            limit=page_size,
            offset=offset
        )
        
        # Get counts
        total = await news_repo.count_by_ticker(ticker_upper)
        sentiment_data = await news_repo.get_sentiment_stats(ticker=ticker_upper)
        
        # Build response
        news_items = [_build_news_item(item) for item in news_data]
        
        return NewsByTickerResponse(
            ticker=ticker_upper,
            news=news_items,
            total=total,
            sentiment_summary=sentiment_data
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
    news_repo: NewsRepository = Depends(get_news_repository)
):
    """Get single news article by ID."""
    try:
        news_data = await news_repo.find_by_id(news_id)
        
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
        data: Raw news data from repository
        
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
        tickers=tickers
    )

