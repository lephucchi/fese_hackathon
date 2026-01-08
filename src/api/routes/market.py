"""
Market routes - Market tab API endpoints.

Provides endpoints for news stack, analytics, and context chat.
Flow: Routes → Services → Repositories
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Header

from pydantic import BaseModel

from ..services.market_service import MarketService
from ..repositories.market_repository import MarketRepository
from ..repositories.chat_repository import ChatRepository
from ..repositories.user_interaction_repository import UserInteractionRepository
from ..repositories.news_repository import NewsRepository
from ..dependencies import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Market"], prefix="/market")


# =========================================================================
# Request/Response Models
# =========================================================================

class ChatRequest(BaseModel):
    """Request model for context chat."""
    query: str
    use_interests: bool = True


class StackItem(BaseModel):
    """Single news stack item."""
    news_id: str
    title: str
    sentiment: Optional[str] = None
    sentiment_color: str = "#95A5A6"
    keywords: list = []
    tickers: list = []
    published_at: Optional[str] = None


class StackResponse(BaseModel):
    """Response for news stack."""
    stack: list
    remaining: int


class AnalyticsResponse(BaseModel):
    """Response for market analytics."""
    period: str
    summary: dict
    top_keywords: list
    top_tickers: list
    sentiment_timeline: list
    industry_heatmap: list


class ChatResponse(BaseModel):
    """Response for context chat."""
    answer: str
    message_id: str
    context_used: int
    cached: bool


# =========================================================================
# Dependencies
# =========================================================================

def get_market_repository(supabase=Depends(get_supabase_client)) -> MarketRepository:
    """Get MarketRepository instance."""
    return MarketRepository(supabase)


def get_chat_repository(supabase=Depends(get_supabase_client)) -> ChatRepository:
    """Get ChatRepository instance."""
    return ChatRepository(supabase)


def get_interaction_repository(supabase=Depends(get_supabase_client)) -> UserInteractionRepository:
    """Get UserInteractionRepository instance."""
    return UserInteractionRepository(supabase)


def get_news_repository(supabase=Depends(get_supabase_client)) -> NewsRepository:
    """Get NewsRepository instance."""
    return NewsRepository(supabase)


def get_market_service(
    market_repo: MarketRepository = Depends(get_market_repository),
    chat_repo: ChatRepository = Depends(get_chat_repository),
    interaction_repo: UserInteractionRepository = Depends(get_interaction_repository),
    news_repo: NewsRepository = Depends(get_news_repository)
) -> MarketService:
    """Get MarketService instance."""
    return MarketService(market_repo, chat_repo, interaction_repo, news_repo)


# =========================================================================
# Endpoints
# =========================================================================

@router.get(
    "/stack",
    response_model=StackResponse,
    summary="Get news stack for swipe",
    description="""
    Get stack of news cards for swipe interaction.
    
    - Returns news that user hasn't interacted with yet
    - Each card has: title, sentiment, keywords, tickers (NO content)
    - Content is only shown after user approves (swipes right)
    """
)
async def get_news_stack(
    limit: int = Query(default=20, ge=1, le=50, description="Max cards to return"),
    x_user_id: Optional[str] = Header(None, description="User ID from auth"),
    market_service: MarketService = Depends(get_market_service)
):
    """Get news stack for swipe UI."""
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "User ID required"}
        )
    
    try:
        result = await market_service.get_news_stack(x_user_id, limit)
        return StackResponse(**result)
        
    except Exception as e:
        logger.error(f"Error getting news stack: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "stack_error", "message": str(e)})


@router.get(
    "/analytics",
    response_model=AnalyticsResponse,
    summary="Get market analytics",
    description="""
    Get market analytics data for visualization.
    
    Includes:
    - Top keywords with sentiment
    - Top tickers mentioned with company names
    - Sentiment timeline by date
    - Industry heatmap
    """
)
async def get_analytics(
    period: str = Query(default="week", description="Period: day, week, or month"),
    market_service: MarketService = Depends(get_market_service)
):
    """Get market analytics."""
    try:
        result = await market_service.get_analytics(period)
        
        if "error" in result:
            raise HTTPException(status_code=500, detail={"error": "analytics_error", "message": result["error"]})
        
        return AnalyticsResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting analytics: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "analytics_error", "message": str(e)})


@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Chat with market context",
    description="""
    Send a query and get response with user's interested news as context.
    
    - Uses approved news (swipe right) as context
    - Context is cached in Redis for 30 minutes
    - Chat history is saved to database
    """
)
async def chat_with_context(
    request: ChatRequest,
    x_user_id: Optional[str] = Header(None, description="User ID from auth"),
    market_service: MarketService = Depends(get_market_service)
):
    """Chat with market context."""
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "User ID required"}
        )
    
    try:
        result = await market_service.chat_with_context(
            user_id=x_user_id,
            query=request.query,
            use_interests=request.use_interests
        )
        return ChatResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in context chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "chat_error", "message": str(e)})


@router.get(
    "/history",
    summary="Get chat history",
    description="Get user's chat conversation history."
)
async def get_chat_history(
    limit: int = Query(default=50, ge=1, le=100, description="Max messages to return"),
    x_user_id: Optional[str] = Header(None, description="User ID from auth"),
    market_service: MarketService = Depends(get_market_service)
):
    """Get chat history."""
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "User ID required"}
        )
    
    try:
        result = await market_service.get_chat_history(x_user_id, limit)
        return result
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "history_error", "message": str(e)})
