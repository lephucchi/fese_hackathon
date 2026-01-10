"""
Market routes - Market tab API endpoints.

Provides endpoints for news stack, analytics, and context chat.
Flow: Routes → Services → Repositories
"""
import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query

from pydantic import BaseModel

from ..services.market_service import MarketService
from ..repositories.market_repository import MarketRepository
from ..repositories.chat_repository import ChatRepository
from ..repositories.user_interaction_repository import UserInteractionRepository
from ..repositories.news_repository import NewsRepository
from ..dependencies import get_supabase_client
from ..middleware.auth import get_current_user_id

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
    
    Requires authentication via JWT token.
    """
)
async def get_news_stack(
    limit: int = Query(default=20, ge=1, le=50, description="Max cards to return"),
    user_id: str = Depends(get_current_user_id),
    market_service: MarketService = Depends(get_market_service)
):
    """Get news stack for swipe UI."""
    try:
        result = await market_service.get_news_stack(user_id, limit)
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
    
    Requires authentication via JWT token.
    """
)
async def chat_with_context(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    market_service: MarketService = Depends(get_market_service)
):
    """Chat with market context."""
    try:
        result = await market_service.chat_with_context(
            user_id=user_id,
            query=request.query,
            use_interests=request.use_interests
        )
        return ChatResponse(**result)
        
    except Exception as e:
        logger.error(f"Error in context chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "chat_error", "message": str(e)})


@router.post(
    "/chat/stream",
    summary="Chat with market context (streaming)",
    description="""
    Stream chat response with thinking process visualization.
    
    Returns Server-Sent Events (SSE) with:
    - Thinking steps (fetching interests, building context, querying LLM)
    - Answer chunks (streamed word by word)
    - Completion signal
    
    Requires authentication via JWT token.
    """
)
async def chat_with_context_stream(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    market_service: MarketService = Depends(get_market_service)
):
    """Stream chat with thinking process."""
    from fastapi.responses import StreamingResponse
    import json
    import asyncio
    
    async def event_generator():
        try:
            # Step 1: Start
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'start', 'message': '🔍 Bắt đầu xử lý câu hỏi...'})}\n\n"
            await asyncio.sleep(0.1)
            
            # Step 2: Fetch interests
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'fetch_interests', 'message': '📊 Đang tải tin tức bạn quan tâm...'})}\n\n"
            
            approved_ids = await market_service.interaction_repo.find_approved_news_ids(user_id)
            
            if not approved_ids:
                yield f"data: {json.dumps({'type': 'error', 'message': 'Bạn chưa chọn tin tức nào. Hãy swipe phải các tin quan tâm trước.'})}\n\n"
                return
            
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'interests_loaded', 'message': f'✅ Tìm thấy {len(approved_ids)} tin tức', 'count': len(approved_ids)})}\n\n"
            await asyncio.sleep(0.1)
            
            # Step 3: Build context
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'build_context', 'message': '🧠 Đang xây dựng context từ tin tức...'})}\n\n"
            
            # Get cached context or build new
            cached_context = await market_service.cache.get_context(user_id)
            
            if not cached_context:
                context_news = await market_service.news_repo.find_by_ids(approved_ids[:10])
                context_data = {
                    "news": [
                        {
                            "title": n.get("title"),
                            "analyst": n.get("analyst"),
                            "sentiment": n.get("sentiment"),
                            "tickers": n.get("Ticker")
                        }
                        for n in context_news
                    ]
                }
                await market_service.cache.set_context(user_id, context_data)
                context_news_list = context_data["news"]
            else:
                context_news_list = cached_context.get("news", [])
            
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'context_ready', 'message': '✅ Context đã sẵn sàng'})}\n\n"
            await asyncio.sleep(0.1)
            
            # Step 4: Query LLM
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'query_llm', 'message': '✍️ Đang tổng hợp câu trả lời...'})}\n\n"
            
            # Build context string
            context_str = market_service._build_context_string(context_news_list)
            
            # Get chat history
            chat_history = await market_service.cache.get_chat_history(user_id, limit=6)
            full_context = market_service._build_full_context(chat_history, context_news_list)
            
            # Save user query
            await market_service.cache.add_chat_message(user_id, "user", request.query)
            
            # Process with RAG
            answer = await market_service._process_with_context(request.query, full_context)
            
            # Step 5: Stream answer
            yield f"data: {json.dumps({'type': 'answer_start'})}\n\n"
            
            # Split answer into sentences and stream
            sentences = answer.split('. ')
            for sentence in sentences:
                if sentence.strip():
                    yield f"data: {json.dumps({'type': 'answer_chunk', 'content': sentence + '. '})}\n\n"
                    await asyncio.sleep(0.05)  # Small delay for streaming effect
            
            # Save assistant response
            await market_service.cache.add_chat_message(user_id, "assistant", answer)
            
            # Save to DB
            import uuid
            message_id = str(uuid.uuid4())
            message_content = json.dumps({
                "query": request.query,
                "answer": answer,
                "context_count": len(context_news_list),
                "use_interests": request.use_interests
            }, ensure_ascii=False)
            
            await market_service.chat_repo.save_message(
                user_id=user_id,
                content=message_content,
                message_id=message_id
            )
            
            # Step 6: Complete
            yield f"data: {json.dumps({'type': 'complete', 'message_id': message_id})}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
        }
    )


@router.get(
    "/history",
    summary="Get chat history",
    description="Get user's chat conversation history. Requires authentication."
)
async def get_chat_history(
    limit: int = Query(default=50, ge=1, le=100, description="Max messages to return"),
    user_id: str = Depends(get_current_user_id),
    market_service: MarketService = Depends(get_market_service)
):
    """Get chat history."""
    try:
        result = await market_service.get_chat_history(user_id, limit)
        return result
        
    except Exception as e:
        logger.error(f"Error getting chat history: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "history_error", "message": str(e)})
