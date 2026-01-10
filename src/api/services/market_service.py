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
        Process chat query with 3-tier response system:
        - Tier 1: Answer from cached facts (fast, ~2-5s)
        - Tier 2: Partial cache + incremental retrieval
        - Tier 3: Full RAG pipeline (slow, ~60-70s)
        
        Args:
            user_id: User UUID
            query: User's query
            use_interests: Whether to use user's approved news as context
            
        Returns:
            Chat response with answer, tier info, and context
        """
        import time
        start_time = time.time()
        
        # 1. Get chat history and cached data
        chat_history = await self.cache.get_chat_history(user_id, limit=6)
        rag_cache = await self.cache.get_rag_cache(user_id)
        cached_context = await self.cache.get_context(user_id)
        
        # 2. Check if we can answer from cache (Tier 1 or 2)
        tier = 3  # Default to full pipeline
        answer = None
        
        if rag_cache and rag_cache.get("facts"):
            from src.core.chat.followup_detector import get_followup_detector, QueryType
            
            detector = get_followup_detector()
            cached_entities = rag_cache.get("entities", [])
            cached_facts = rag_cache.get("facts", [])
            query_type = detector.classify(query, cached_entities, chat_history, cached_facts)
            
            logger.info(f"[3-Tier] Query type: {query_type.value}, Cached entities: {cached_entities}")
            
            if query_type == QueryType.CACHE_HIT:
                # Tier 1: Answer directly from cached context
                tier = 1
                logger.info(f"[3-Tier] Using Tier 1: Answer from cache")
                
                from src.core.chat.fast_answer import generate_from_cache
                answer = await generate_from_cache(
                    query=query,
                    cached_facts=rag_cache.get("facts", []),
                    chat_history=chat_history,
                    cached_entities=cached_entities,
                    ticker_news=rag_cache.get("ticker_news", {}),
                    web_contexts=rag_cache.get("web_contexts", [])
                )
                
                # Add context note
                total_context = (
                    len(rag_cache.get("facts", [])) +
                    sum(len(v) for v in rag_cache.get("ticker_news", {}).values()) +
                    len(rag_cache.get("web_contexts", []))
                )
                answer = f"📰 *Dựa trên {total_context} context items đã cached:*\n\n{answer}"
            
            elif query_type == QueryType.PARTIAL_HIT:
                # Tier 2: We have some cached info, but need more
                # For now, fall through to Tier 3 (can optimize later)
                tier = 3
                logger.info(f"[3-Tier] Partial hit - using Tier 3 for additional context")
        
        # 3. Tier 3: Full pipeline (if no cache hit)
        if tier == 3:
            logger.info(f"[3-Tier] Using Tier 3: Full RAG pipeline")
            
            # Extract entities from query for ticker news
            from src.core.chat.followup_detector import get_followup_detector
            detector = get_followup_detector()
            query_entities = detector.extract_entities(query)
            
            # Build context from user interests
            context_news = []
            if use_interests and not cached_context:
                approved_ids = await self.interaction_repo.find_approved_news_ids(user_id)
                
                if approved_ids:
                    context_news = await self.news_repo.find_by_ids(approved_ids[:10])
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
            
            # Fetch ticker-related news for each entity
            ticker_news = {}
            for ticker in query_entities:
                try:
                    news_items = await self.news_repo.find_by_ticker(ticker, limit=5)
                    if news_items:
                        ticker_news[ticker] = [
                            {
                                "title": n.get("title", ""),
                                "content": (n.get("content", "") or "")[:500],
                                "sentiment": n.get("sentiment", ""),
                                "published_at": n.get("published_at", "")
                            }
                            for n in news_items
                        ]
                        logger.info(f"[3-Tier] Fetched {len(news_items)} news for ticker {ticker}")
                except Exception as e:
                    logger.warning(f"Failed to fetch news for ticker {ticker}: {e}")
            
            # Build full context and process
            context_str = self._build_full_context(chat_history, context_news)
            answer, extracted_data, pipeline_logs = await self._process_with_context_and_cache(query, context_str)
            
            # Cache RAG results with enhanced context
            if extracted_data:
                await self.cache.set_rag_cache(user_id, {
                    "entities": extracted_data.get("entities", []),
                    "facts": extracted_data.get("facts", []),
                    "ticker_news": ticker_news,  # NEW: Ticker-related news
                    "retrieved_docs": extracted_data.get("retrieved_docs", []),  # NEW
                    "web_contexts": extracted_data.get("web_contexts", []),  # NEW
                    "last_query": query
                })
        
        # 4. Save to chat history
        await self.cache.add_chat_message(user_id, "user", query)
        await self.cache.add_chat_message(user_id, "assistant", answer)
        
        # 5. Save to DB
        import uuid
        message_id = str(uuid.uuid4())
        
        elapsed = time.time() - start_time
        message_content = json.dumps({
            "query": query,
            "answer": answer,
            "tier": tier,
            "elapsed_ms": int(elapsed * 1000),
            "use_interests": use_interests
        }, ensure_ascii=False)
        
        await self.chat_repo.save_message(
            user_id=user_id,
            content=message_content,
            message_id=message_id
        )
        
        # 6. Extend cache TTL
        await self.cache.extend_ttl(user_id)
        
        logger.info(f"[3-Tier] Response generated in {elapsed:.2f}s (Tier {tier})")
        
        # Prepare logs for UI
        logs = []
        if tier == 1:
            # Tier 1 logs
            logs = [
                {"step": "analyze", "detail": "Detected follow-up question", "timestamp": start_time * 1000},
                {"step": "cache", "detail": f"Found {len(rag_cache.get('facts', []))} cached facts", "timestamp": start_time * 1000 + 10},
                {"step": "generate", "detail": "Generated answer from cache", "timestamp": start_time * 1000 + 50}
            ]
        elif tier == 3 and 'pipeline_logs' in locals():
             logs = pipeline_logs

        return {
            "answer": answer,
            "message_id": message_id,
            "context_used": len(rag_cache.get("facts", [])) if rag_cache else 0,
            "history_used": len(chat_history),
            "cached": tier < 3,
            "tier": tier,
            "elapsed_ms": int(elapsed * 1000),
            "logs": logs
        }
    
    def _build_full_context(
        self,
        chat_history: List[Dict],
        news_list: List[Dict]
    ) -> str:
        """
        Build full context string including chat history and news.
        
        Args:
            chat_history: Previous Q&A messages
            news_list: Approved news context
            
        Returns:
            Combined context string
        """
        parts = []
        
        # Add chat history if exists
        if chat_history:
            history_parts = []
            for msg in chat_history:
                role = "Người dùng" if msg.get("role") == "user" else "Trợ lý"
                history_parts.append(f"{role}: {msg.get('content', '')}")
            
            parts.append("=== LỊCH SỬ TRÒ CHUYỆN ===")
            parts.append("\n".join(history_parts))
            parts.append("")
        
        # Add news context
        news_str = self._build_context_string(news_list)
        if news_str:
            parts.append("=== TIN TỨC ĐÃ CHỌN ===")
            parts.append(news_str)
        
        return "\n".join(parts)
    
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
        Process query with context using the RAG pipeline.
        
        Augments the user query with their selected news context,
        then calls the existing RAG pipeline for grounded answer generation.
        
        Args:
            query: User's question
            context: Formatted context string from approved news
            
        Returns:
            Generated answer string
        """
        try:
            # Build augmented query with context
            if context:
                augmented_query = self._build_augmented_query(query, context)
            else:
                augmented_query = query
            
            # Call RAG pipeline with both augmented query and original user query
            from src.pipeline import run_rag_pipeline_async
            result = await run_rag_pipeline_async(
                augmented_query,
                user_query=query  # Pass original query for fallback detection
            )
            
            answer = result.get("answer", "")
            
            # Add context note if we used interests
            if context and answer:
                context_count = context.count('[')
                answer = f"📰 *Dựa trên {context_count} tin tức bạn quan tâm:*\n\n{answer}"
            
            return answer
            
        except Exception as e:
            logger.error(f"RAG processing error: {e}", exc_info=True)
            # Always return error message
            return f"Đã xảy ra lỗi khi xử lý. Vui lòng thử lại.\nLỗi: {str(e)}"
    
    async def _process_with_context_and_cache(
        self,
        query: str,
        context: str
    ) -> tuple:
        """
        Process query with context and return both answer and extracted data.
        
        Returns data for caching: entities and facts.
        
        Args:
            query: User's question
            context: Formatted context string
            
        Returns:
            Tuple of (answer_string, extracted_data_dict)
        """
        try:
            # Build augmented query with context
            if context:
                augmented_query = self._build_augmented_query(query, context)
            else:
                augmented_query = query
            
            # Call RAG pipeline
            from src.pipeline import run_rag_pipeline_async
            result = await run_rag_pipeline_async(
                augmented_query,
                user_query=query
            )
            
            answer = result.get("answer", "")
            
            # Extract entities and facts from pipeline result
            extracted_data = {
                "entities": [],
                "facts": []
            }
            
            # Extract entities from query (tickers)
            import re
            ticker_pattern = r'\b([A-Z]{2,4})\b'
            tickers = re.findall(ticker_pattern, query + " " + answer)
            excluded = {'ROE', 'ROA', 'EPS', 'GDP', 'USD', 'VND', 'THE', 'FOR', 'AND', 'VUI'}
            extracted_data["entities"] = list(set([t for t in tickers if t not in excluded]))
            
            # Extract facts from citations if available
            citations = result.get("citations", {})
            if citations:
                # Handle both dict and list citations format
                if isinstance(citations, dict):
                    for cite_id, cite_data in list(citations.items())[:20]:
                        if isinstance(cite_data, dict):
                            extracted_data["facts"].append({
                                "citation_id": cite_id,
                                "content": cite_data.get("content", "")[:500],
                                "source": cite_data.get("source", ""),
                                "category": "RETRIEVED"
                            })
                elif isinstance(citations, list):
                    for i, cite_data in enumerate(citations[:20]):
                        if isinstance(cite_data, dict):
                            extracted_data["facts"].append({
                                "citation_id": str(i),
                                "content": cite_data.get("content", "")[:500],
                                "source": cite_data.get("source", ""),
                                "category": "RETRIEVED"
                            })
            
            # Also try to get canonical facts if available
            canonical_facts = result.get("canonical_facts", [])
            if canonical_facts:
                for fact in canonical_facts[:15]:
                    extracted_data["facts"].append({
                        "category": fact.get("category", ""),
                        "sub_category": fact.get("sub_category", ""),
                        "statement": fact.get("statement", ""),
                        "source_ids": fact.get("source_ids", [])
                    })
            
            # Only add context note if we actually have context
            # Don't add note if just running pure RAG pipeline
            # Note: context_count check removed - let RAG answer speak for itself
            
            logger.info(f"[Pipeline] Extracted {len(extracted_data['entities'])} entities, {len(extracted_data['facts'])} facts")
            
            # Extract logs from pipeline result
            logs = result.get("logs", [])
            
            return answer, extracted_data, logs
            
        except Exception as e:
            logger.error(f"RAG processing error: {e}", exc_info=True)
            # Always return error message, don't block when no context
            return f"Đã xảy ra lỗi khi xử lý. Vui lòng thử lại.\nLỗi: {str(e)}", None, []
            
        except Exception as e:
            logger.error(f"RAG processing error: {e}", exc_info=True)
            # Always return error message, don't block when no context
            return f"Đã xảy ra lỗi khi xử lý. Vui lòng thử lại.\nLỗi: {str(e)}", None
    
    def _build_augmented_query(self, query: str, context: str) -> str:
        """
        Build augmented query with context for RAG.
        
        Args:
            query: Original user query
            context: Formatted news context
            
        Returns:
            Augmented query string
        """
        return f"""Dựa trên các tin tức tài chính sau đây mà người dùng đã chọn:

{context}

Câu hỏi của người dùng: {query}

Hãy trả lời câu hỏi dựa trên context tin tức được cung cấp và kiến thức chung về thị trường tài chính Việt Nam. Nếu câu trả lời không thể tìm thấy trong context, hãy nói rõ và đưa ra thông tin chung."""
    
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
