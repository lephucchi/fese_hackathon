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
from ...core.security import get_query_guard

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
    content: Optional[str] = None
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
    tier: Optional[int] = None  # 1=cache, 2=partial, 3=full pipeline
    elapsed_ms: Optional[int] = None
    history_used: Optional[int] = None
    logs: Optional[list] = None
    citations: Optional[list] = None


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
        # SECURITY: Check query with QueryGuard
        query_guard = get_query_guard()
        guard_result = query_guard.check(request.query)
        
        if not guard_result.is_safe:
            logger.warning(
                f"Market chat query blocked: {guard_result.reason}. "
                f"Risk: {guard_result.risk_level.value}"
            )
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "query_blocked",
                    "message": guard_result.reason,
                    "risk_level": guard_result.risk_level.value,
                    "suggestions": guard_result.suggestions
                }
            )
        
        result = await market_service.chat_with_context(
            user_id=user_id,
            query=request.query,
            use_interests=request.use_interests
        )
        return ChatResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in context chat: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "chat_error", "message": str(e)})


@router.post(
    "/chat/stream",
    summary="Chat with market context (streaming)",
    description="""
    Stream chat response with REAL-TIME thinking process visualization.
    
    Returns Server-Sent Events (SSE) with pipeline steps:
    - Route: Analyzing query intent
    - Decompose: Breaking down complex queries  
    - Retrieve: Searching documents
    - Fallback Check: Checking coverage
    - Extract Facts: Extracting canonical facts (CAF)
    - Synthesize: Generating final answer
    
    Requires authentication via JWT token.
    """
)
async def chat_with_context_stream(
    request: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    market_service: MarketService = Depends(get_market_service)
):
    """Stream chat with real-time pipeline visualization."""
    from fastapi.responses import StreamingResponse
    from src.pipeline import run_rag_pipeline_streaming
    from src.core.security import get_query_guard
    import json
    import uuid
    
    async def event_generator():
        try:
            # Security check
            query_guard = get_query_guard()
            guard_result = query_guard.check(request.query)
            
            if not guard_result.is_safe:
                logger.warning(f"Stream query blocked: {guard_result.reason}")
                yield f"data: {json.dumps({'type': 'error', 'message': guard_result.reason, 'suggestions': guard_result.suggestions}, ensure_ascii=False)}\n\n"
                return
            
            # Step 0: Start & load context
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'start', 'status': 'running', 'message': '🔍 Bắt đầu xử lý câu hỏi...', 'elapsed_ms': 0}, ensure_ascii=False)}\n\n"
            
            # 1. Fetch user swiped-right news IDs
            approved_ids = await market_service.interaction_repo.find_approved_news_ids(user_id)
            logger.info(f"[STREAM] Found {len(approved_ids)} approved news IDs for user {user_id}")
            
            # 2. Fetch user portfolio tickers
            portfolio_tickers = []
            try:
                from src.api.repositories.portfolio_repository import PortfolioRepository
                from src.api.dependencies import get_supabase_client
                supabase = get_supabase_client()
                portfolio_repo = PortfolioRepository(supabase)
                positions = await portfolio_repo.find_by_user(user_id)
                portfolio_tickers = [pos.get("ticker") for pos in positions if pos.get("ticker")]
                logger.info(f"[STREAM] Found {len(portfolio_tickers)} portfolio tickers: {portfolio_tickers}")
            except Exception as e:
                logger.warning(f"[STREAM] Failed to fetch portfolio: {e}")
            
            # Emit context loading with portfolio info
            tickers_display = f", {len(portfolio_tickers)} tickers: {', '.join(portfolio_tickers[:5])}" if portfolio_tickers else ""
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'context', 'status': 'running', 'message': f'📊 Đang tải context ({len(approved_ids)} tin quẹt phải{tickers_display})...', 'elapsed_ms': 0, 'data': {'portfolio_tickers': portfolio_tickers}}, ensure_ascii=False)}\n\n"
            
            # 3. Build context from approved news
            context_news = []
            if approved_ids:
                logger.info(f"[STREAM] Approved IDs: {approved_ids[:5]}...")  # Log first 5 IDs
                cached_context = await market_service.cache.get_context(user_id)
                if not cached_context:
                    fetched_news = await market_service.news_repo.find_by_ids(approved_ids[:10])
                    logger.info(f"[STREAM] Fetched {len(fetched_news)} news from {len(approved_ids[:10])} IDs")
                    for fn in fetched_news[:3]:  # Log first 3 news for debugging
                        logger.info(f"[STREAM] News: {fn.get('title', 'NO TITLE')[:50]} - Ticker: {fn.get('Ticker')}")
                    context_news = [
                        {
                            "title": n.get("title"),
                            "analyst": n.get("analyst"),
                            "sentiment": n.get("sentiment"),
                            "tickers": n.get("Ticker"),
                            "content": (n.get("content") or "")[:300]
                        }
                        for n in fetched_news
                    ]
                    # Don't cache yet - will add portfolio news first
                else:
                    context_news = cached_context.get("news", [])
                    logger.info(f"[STREAM] Using {len(context_news)} cached news")
            
            # 4. Fetch news from portfolio tickers (mapping)
            ticker_news = []
            for ticker in portfolio_tickers[:5]:  # Limit to top 5 tickers
                try:
                    news_items = await market_service.news_repo.find_by_ticker(ticker, limit=3)
                    for n in news_items:
                        # Avoid duplicates
                        news_id = n.get("news_id") or n.get("id")
                        if news_id not in approved_ids:
                            ticker_news.append({
                                "title": n.get("title"),
                                "analyst": n.get("analyst"),
                                "sentiment": n.get("sentiment"),
                                "tickers": ticker,
                                "content": (n.get("content") or "")[:300],
                                "source": f"portfolio:{ticker}"
                            })
                    logger.info(f"[STREAM] Fetched {len(news_items)} news for portfolio ticker {ticker}")
                except Exception as e:
                    logger.warning(f"[STREAM] Failed to fetch news for ticker {ticker}: {e}")
            
            # Merge context: approved news + portfolio ticker news
            all_context_news = context_news + ticker_news[:10]  # Limit ticker news to 10
            logger.info(f"[STREAM] Total context: {len(context_news)} approved + {len(ticker_news[:10])} ticker = {len(all_context_news)} news")
            
            # Cache combined context
            if all_context_news and not await market_service.cache.get_context(user_id):
                await market_service.cache.set_context(user_id, {"news": all_context_news})
            
            # Enhanced context done message with ticker info
            tickers_msg = f" + {', '.join(portfolio_tickers[:3])}" if portfolio_tickers else ""
            yield f"data: {json.dumps({'type': 'thinking', 'step': 'context', 'status': 'done', 'message': f'✅ Context sẵn sàng ({len(all_context_news)} tin{tickers_msg})', 'elapsed_ms': 100, 'data': {'portfolio_tickers': portfolio_tickers, 'context_count': len(all_context_news)}}, ensure_ascii=False)}\n\n"
            
            # Get chat history and build full context
            chat_history = await market_service.cache.get_chat_history(user_id, limit=6)
            full_context = market_service._build_full_context(chat_history, all_context_news, portfolio_tickers)
            
            # Build augmented query
            if full_context:
                augmented_query = market_service._build_augmented_query(request.query, full_context)
            else:
                augmented_query = request.query
            
            # Save user query to history
            await market_service.cache.add_chat_message(user_id, "user", request.query)
            
            # Run streaming pipeline
            final_result = None
            async for event in run_rag_pipeline_streaming(
                query=augmented_query,
                user_id=user_id,
                user_query=request.query
            ):
                if event["type"] == "thinking":
                    # Forward thinking events to frontend
                    yield f"data: {json.dumps(event, ensure_ascii=False)}\n\n"
                    
                elif event["type"] == "complete":
                    final_result = event["result"]
                    
                    # Start streaming answer
                    yield f"data: {json.dumps({'type': 'answer_start'}, ensure_ascii=False)}\n\n"
                    
                    # Stream answer in chunks
                    answer = final_result.get("answer", "")
                    
                    # Add context note
                    if all_context_news and answer:
                        answer = f"📰 *Dựa trên {len(all_context_news)} tin tức bạn quan tâm:*\n\n{answer}"
                    
                    # Split into sentences and stream
                    import re
                    sentences = re.split(r'(?<=[.!?])\s+', answer)
                    for sentence in sentences:
                        if sentence.strip():
                            yield f"data: {json.dumps({'type': 'answer_chunk', 'content': sentence + ' '}, ensure_ascii=False)}\n\n"
                    
                    # Save assistant response
                    await market_service.cache.add_chat_message(user_id, "assistant", answer)
                    
                    # Save to DB
                    message_id = str(uuid.uuid4())
                    message_content = json.dumps({
                        "query": request.query,
                        "answer": answer,
                        "context_count": len(context_news),
                        "use_interests": request.use_interests,
                        "total_time_ms": event.get("total_time_ms", 0)
                    }, ensure_ascii=False)
                    
                    await market_service.chat_repo.save_message(
                        user_id=user_id,
                        content=message_content,
                        message_id=message_id
                    )
                    
                    # Build frontend citations with full info
                    frontend_citations = []
                    citations_map = final_result.get("citations_map", {})
                    used_citations = final_result.get("citations", [])
                    used_nums = {c.get("number") for c in used_citations if c.get("used")}
                    
                    logger.info(f"[STREAM] citations_map type: {type(citations_map)}, length: {len(citations_map) if citations_map else 0}")
                    logger.info(f"[STREAM] used_citations: {used_citations[:5] if used_citations else []}")
                    logger.info(f"[STREAM] used_nums: {used_nums}")
                    
                    if citations_map:
                        if isinstance(citations_map, list):
                            for citation in citations_map:
                                num = citation.get("number")
                                # If no used_nums filter, take all; otherwise filter by used
                                if not used_nums or num in used_nums:
                                    frontend_citations.append({
                                        "number": num,
                                        "source": citation.get("source", "Unknown"),
                                        "preview": (citation.get("preview") or "")[:150] + "...",
                                        "similarity": citation.get("similarity")
                                    })
                        elif isinstance(citations_map, dict):
                            for num_str, data in citations_map.items():
                                try:
                                    num = int(num_str)
                                    if not used_nums or num in used_nums:
                                        frontend_citations.append({
                                            "number": num,
                                            "source": data.get("source", "Unknown"),
                                            "preview": (data.get("content", "") or "")[:150] + "...",
                                            "similarity": data.get("score") or data.get("similarity")
                                        })
                                except:
                                    continue
                    
                    frontend_citations.sort(key=lambda x: x["number"])
                    logger.info(f"[STREAM] Final frontend_citations count: {len(frontend_citations)}")
                    
                    # Send completion with metadata
                    yield f"data: {json.dumps({'type': 'complete', 'message_id': message_id, 'total_time_ms': event.get('total_time_ms', 0), 'citations': frontend_citations[:5]}, ensure_ascii=False)}\n\n"
            
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)}, ensure_ascii=False)}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
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
