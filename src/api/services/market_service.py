"""
Market Service - Business logic for market operations.

Handles market tab logic: news stack, analytics, and context chat.
"""
import json
import logging
from typing import Dict, Any, List, Optional

from ..repositories.market_repository import MarketRepository
from ..repositories.chat_repository import ChatRepository
from ..repositories.user_interaction_repository import UserInteractionRepository
from ..repositories.news_repository import NewsRepository
from ..services.cache_service import get_cache_service

logger = logging.getLogger(__name__)


class MarketService:
    """Service for market operations."""
    
    def __init__(
        self,
        market_repo: MarketRepository,
        chat_repo: ChatRepository,
        interaction_repo: UserInteractionRepository,
        news_repo: NewsRepository
    ):
        """
        Initialize market service.
        
        Args:
            market_repo: MarketRepository instance
            chat_repo: ChatRepository instance
            interaction_repo: UserInteractionRepository instance
            news_repo: NewsRepository instance
        """
        self.market_repo = market_repo
        self.chat_repo = chat_repo
        self.interaction_repo = interaction_repo
        self.news_repo = news_repo
        self.cache = get_cache_service()
    
    async def get_news_stack(
        self,
        user_id: str,
        limit: int = 20
    ) -> Dict[str, Any]:
        """
        Get news stack for swipe UI.
        
        Args:
            user_id: User UUID
            limit: Maximum news cards to return
            
        Returns:
            Dict with stack and remaining count
        """
        stack = await self.market_repo.get_news_stack(user_id, limit)
        remaining = await self.market_repo.count_remaining_stack(user_id)
        
        return {
            "stack": stack,
            "remaining": remaining
        }
    
    async def get_analytics(
        self,
        period: str = "week"
    ) -> Dict[str, Any]:
        """
        Get market analytics.
        
        Args:
            period: 'day', 'week', or 'month'
            
        Returns:
            Analytics data dict
        """
        days_map = {
            "day": 1,
            "week": 7,
            "month": 30
        }
        days = days_map.get(period, 7)
        
        analytics = await self.market_repo.get_analytics(period, days)
        return analytics
    
    async def chat_with_context(
        self,
        user_id: str,
        query: str,
        use_interests: bool = True
    ) -> Dict[str, Any]:
        """
        Process chat query with user's interested news as context.
        
        Args:
            user_id: User UUID
            query: User's query
            use_interests: Whether to use user's approved news as context
            
        Returns:
            Chat response with answer and context info
        """
        # 1. Try to get cached context
        cached_context = await self.cache.get_context(user_id)
        
        # 2. Build context from user interests if needed
        context_news = []
        if use_interests and not cached_context:
            # Get approved news IDs
            approved_ids = await self.interaction_repo.find_approved_news_ids(user_id)
            
            if approved_ids:
                # Fetch news with analyst content
                context_news = await self.news_repo.find_by_ids(approved_ids[:10])  # Limit to 10
                
                # Cache the context
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
                await self.cache.set_context(user_id, context_data)
        elif cached_context:
            context_news = cached_context.get("news", [])
        
        # 3. Build context string for RAG
        context_str = self._build_context_string(context_news)
        
        # 4. Process query (simplified - integrate with RAG pipeline later)
        answer = await self._process_with_context(query, context_str)
        
        # 5. Save to chat history
        import uuid
        message_id = str(uuid.uuid4())
        
        message_content = json.dumps({
            "query": query,
            "answer": answer,
            "context_count": len(context_news),
            "use_interests": use_interests
        }, ensure_ascii=False)
        
        await self.chat_repo.save_message(
            user_id=user_id,
            content=message_content,
            message_id=message_id
        )
        
        # 6. Extend cache TTL
        await self.cache.extend_ttl(user_id)
        
        return {
            "answer": answer,
            "message_id": message_id,
            "context_used": len(context_news),
            "cached": cached_context is not None
        }
    
    def _build_context_string(self, news_list: List[Dict]) -> str:
        """Build context string from news list."""
        if not news_list:
            return ""
        
        context_parts = []
        for i, news in enumerate(news_list, 1):
            analyst = news.get("analyst") or {}
            
            part = f"[{i}] {news.get('title', 'Untitled')}\n"
            
            if analyst.get("finbert"):
                part += f"- FinBERT Sentiment: {analyst['finbert'].get('sentiment')} ({analyst['finbert'].get('confidence', 0):.2f})\n"
            
            if analyst.get("average"):
                part += f"- Average Score: {analyst['average'].get('score', 0):.2f}\n"
            
            if analyst.get("keywords"):
                part += f"- Keywords: {', '.join(analyst['keywords'][:5])}\n"
            
            context_parts.append(part)
        
        return "\n".join(context_parts)
    
    async def _process_with_context(self, query: str, context: str) -> str:
        """
        Process query with context.
        
        TODO: Integrate with actual RAG pipeline.
        For now, return a placeholder response.
        """
        if context:
            return f"Dựa trên {context.count('[') } tin tức bạn quan tâm:\n\n" \
                   f"Query của bạn: {query}\n\n" \
                   f"[Placeholder - Integrate với RAG pipeline để có câu trả lời thực]"
        else:
            return f"Bạn chưa chọn tin tức nào. Hãy swipe phải các tin quan tâm trước."
    
    async def get_chat_history(
        self,
        user_id: str,
        limit: int = 50
    ) -> Dict[str, Any]:
        """
        Get user's chat history.
        
        Args:
            user_id: User UUID
            limit: Maximum messages to return
            
        Returns:
            Dict with messages and count
        """
        messages = await self.chat_repo.get_history(user_id, limit)
        count = await self.chat_repo.count_messages(user_id)
        
        return {
            "messages": messages,
            "total": count
        }
