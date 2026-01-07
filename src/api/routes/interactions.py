"""
Interactions routes - User interaction API endpoints.

Provides endpoints for managing user interactions with news.
Flow: Routes → Services → Repositories
"""
import logging
from fastapi import APIRouter, HTTPException, Depends, Header
from typing import Optional

from ..schemas.requests.interaction import CreateInteractionRequest
from ..schemas.responses.interaction import InteractionResponse, UserInterestsResponse
from ..schemas.responses import NewsItem, TickerInfo, ErrorResponse
from ..services.user_interaction_service import UserInteractionService
from ..repositories.user_interaction_repository import UserInteractionRepository
from ..repositories.news_repository import NewsRepository
from ..dependencies import get_supabase_client

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Interactions"], prefix="/interactions")


def get_user_interaction_repository(
    supabase=Depends(get_supabase_client)
) -> UserInteractionRepository:
    """Dependency to get UserInteractionRepository instance."""
    return UserInteractionRepository(supabase)


def get_news_repository(
    supabase=Depends(get_supabase_client)
) -> NewsRepository:
    """Dependency to get NewsRepository instance."""
    return NewsRepository(supabase)


def get_user_interaction_service(
    interaction_repo: UserInteractionRepository = Depends(get_user_interaction_repository),
    news_repo: NewsRepository = Depends(get_news_repository)
) -> UserInteractionService:
    """Dependency to get UserInteractionService instance."""
    return UserInteractionService(interaction_repo, news_repo)


@router.post(
    "",
    response_model=InteractionResponse,
    responses={
        200: {"description": "Interaction saved"},
        400: {"model": ErrorResponse, "description": "Invalid request"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Create user interaction",
    description="""
    Record user's interaction with a news article (swipe action).
    
    - **news_id**: UUID of the news article
    - **action_type**: 'approve' (swipe right) or 'reject' (swipe left)
    """
)
async def create_interaction(
    request: CreateInteractionRequest,
    x_user_id: Optional[str] = Header(None, description="User ID from auth"),
    interaction_service: UserInteractionService = Depends(get_user_interaction_service)
):
    """Create or update user interaction with news."""
    # TODO: Get user_id from JWT token instead of header
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "User ID required"}
        )
    
    try:
        result = await interaction_service.create_interaction(
            user_id=x_user_id,
            news_id=request.news_id,
            action_type=request.action_type
        )
        
        return InteractionResponse(
            message=result["message"],
            interaction_id=result["interaction_id"]
        )
        
    except Exception as e:
        logger.error(f"Error creating interaction: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "create_error", "message": str(e)}
        )


@router.get(
    "/my-interests",
    response_model=UserInterestsResponse,
    responses={
        200: {"description": "User's interested news with analyst"},
        401: {"model": ErrorResponse, "description": "Unauthorized"},
        500: {"model": ErrorResponse, "description": "Server error"},
    },
    summary="Get user's interested news",
    description="Get all news articles that user has approved (swiped right) with analyst content."
)
async def get_my_interests(
    x_user_id: Optional[str] = Header(None, description="User ID from auth"),
    interaction_service: UserInteractionService = Depends(get_user_interaction_service)
):
    """Get user's interested news with analyst content."""
    if not x_user_id:
        raise HTTPException(
            status_code=401,
            detail={"error": "unauthorized", "message": "User ID required"}
        )
    
    try:
        result = await interaction_service.get_user_interests(x_user_id)
        
        news_items = [_build_news_item(item) for item in result["news"]]
        
        return UserInterestsResponse(
            news=news_items,
            total=result["total"],
            has_analysis=result["has_analysis"],
            missing_analysis=result["missing_analysis"]
        )
        
    except Exception as e:
        logger.error(f"Error fetching user interests: {e}", exc_info=True)
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
