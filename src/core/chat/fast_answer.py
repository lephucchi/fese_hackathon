"""
Fast Answer Generator - Direct LLM answering from cached context.

Bypasses full RAG pipeline for follow-up queries using cached:
- Facts
- Ticker news
- Web contexts
"""
import logging
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


async def generate_from_cache(
    query: str,
    cached_facts: List[Dict],
    chat_history: Optional[List[Dict]] = None,
    cached_entities: Optional[List[str]] = None,
    ticker_news: Optional[Dict[str, List[Dict]]] = None,
    web_contexts: Optional[List[Dict]] = None
) -> str:
    """
    Generate answer directly from cached context without running RAG pipeline.
    
    Args:
        query: User's question
        cached_facts: List of extracted facts from previous queries
        chat_history: Recent chat messages
        cached_entities: List of entities (for context)
        ticker_news: News articles by ticker {"VIC": [...], "FPT": [...]}
        web_contexts: Web search results from previous fallback
        
    Returns:
        Generated answer string
    """
    try:
        from google import genai
        from google.genai import types
        import os
        import re
        
        # Extract entities from query for relevance filtering
        query_entities = _extract_query_entities(query)
        
        # Filter facts by relevance to current query
        relevant_facts = _filter_facts_by_relevance(cached_facts, query_entities)
        
        # Format all context sources
        facts_str = _format_facts(relevant_facts)
        history_str = _format_history(chat_history) if chat_history else ""
        entities_str = ", ".join(cached_entities) if cached_entities else "N/A"
        
        # Filter ticker_news to only relevant tickers
        relevant_ticker_news = {}
        if ticker_news:
            for ticker in ticker_news:
                if any(ticker.upper() == e.upper() for e in query_entities) or not query_entities:
                    relevant_ticker_news[ticker] = ticker_news[ticker]
        
        # === FALLBACK LOGIC ===
        # If no relevant facts AND no relevant ticker news, trigger Google Search
        if not relevant_facts and not relevant_ticker_news and not web_contexts:
            logger.info(f"[FastAnswer] No relevant context found. Triggering Google Search fallback.")
            try:
                from src.core.fallback.google_search import GoogleSearchGrounding
                search_service = GoogleSearchGrounding()
                result = await search_service.asearch(query)
                answer = result.get("fallback_response", "")
                if answer:
                    logger.info(f"[FastAnswer] Generated answer from fallback: {len(answer)} chars")
                    return answer
            except Exception as e:
                logger.error(f"[FastAnswer] Fallback failed: {e}")
                # Continue to generic answer if fallback fails
        # ======================

        ticker_news_str = _format_ticker_news(relevant_ticker_news) if relevant_ticker_news else ""
        web_str = _format_web_contexts(web_contexts) if web_contexts else ""
        
        logger.info(f"[FastAnswer] Query entities: {query_entities}, Relevant facts: {len(relevant_facts)}/{len(cached_facts)}")
        
        prompt = f"""Bạn là trợ lý tài chính thân thiện. Trả lời câu hỏi dựa trên context được cung cấp.

=== ENTITIES ĐANG XEM XÉT ===
{entities_str}

=== TIN TỨC LIÊN QUAN ===
{ticker_news_str}

=== FACTS ĐÃ TRÍCH XUẤT ===
{facts_str}

=== KẾT QUẢ TÌM KIẾM WEB ===
{web_str}

=== LỊCH SỬ CHAT ===
{history_str}

=== CÂU HỎI MỚI ===
{query}

=== HƯỚNG DẪN ===
- Ưu tiên sử dụng tin tức và web contexts nếu có thông tin liên quan
- Trả lời đầy đủ, thân thiện với emoji 📈
- Thêm citations [số] khi dùng thông tin cụ thể
- Nếu không có đủ thông tin, nói rõ và đề xuất tìm kiếm thêm

Trả lời:"""
        
        # Use Gemini for fast generation
        client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
        
        response = await client.aio.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=700
            )
        )
        
        answer = response.text.strip()
        context_count = len(cached_facts) + len(ticker_news or {}) + len(web_contexts or [])
        logger.info(f"[FastAnswer] Generated {len(answer)} chars from {context_count} context items")
        
        return answer
        
    except Exception as e:
        logger.error(f"[FastAnswer] Error generating from cache: {e}")
        return f"Xin lỗi, đã xảy ra lỗi khi xử lý. Vui lòng thử lại."


def _format_facts(facts: List[Dict]) -> str:
    """Format cached facts for prompt."""
    if not facts:
        return "Không có facts cached."
    
    lines = []
    for i, fact in enumerate(facts[:15], 1):  # Limit to 15 facts
        category = fact.get("category", "")
        statement = fact.get("statement", fact.get("content", ""))
        lines.append(f"[{i}] ({category}) {statement[:300]}")
    
    return "\n".join(lines)


def _format_ticker_news(ticker_news: Dict[str, List[Dict]]) -> str:
    """Format ticker news for prompt."""
    if not ticker_news:
        return "Không có tin tức liên quan."
    
    lines = []
    idx = 1
    for ticker, news_list in ticker_news.items():
        lines.append(f"\n📊 {ticker}:")
        for news in news_list[:3]:  # 3 news per ticker
            title = news.get("title", "")
            content = news.get("content", "")[:200]
            sentiment = news.get("sentiment", "")
            lines.append(f"  [{idx}] {title}")
            if content:
                lines.append(f"      {content}...")
            if sentiment:
                lines.append(f"      Sentiment: {sentiment}")
            idx += 1
    
    return "\n".join(lines)


def _format_web_contexts(web_contexts: List[Dict]) -> str:
    """Format web search results for prompt."""
    if not web_contexts:
        return "Không có kết quả web."
    
    lines = []
    for i, ctx in enumerate(web_contexts[:5], 1):
        content = ctx.get("content", "")[:300]
        source = ctx.get("source", "web")
        lines.append(f"[W{i}] ({source}) {content}")
    
    return "\n".join(lines)


def _format_history(history: List[Dict]) -> str:
    """Format chat history for prompt."""
    if not history:
        return "Chưa có lịch sử chat."
    
    lines = []
    for msg in history[-4:]:  # Last 4 messages
        role = "User" if msg.get("role") == "user" else "Assistant"
        content = msg.get("content", "")[:150]
        lines.append(f"{role}: {content}")
    
    return "\n".join(lines)


def _extract_query_entities(query: str) -> List[str]:
    """Extract stock tickers and company names from query."""
    import re
    
    # Pattern for Vietnamese stock tickers (2-4 uppercase letters)
    ticker_pattern = r'\b([A-Z]{2,4})\b'
    tickers = re.findall(ticker_pattern, query)
    
    # Filter out common words that look like tickers
    excluded = {'ROE', 'ROA', 'EPS', 'P/E', 'P/B', 'GDP', 'USD', 'VND', 'THE', 'FOR', 'AND', 'NAM'}
    entities = [t for t in tickers if t.upper() not in excluded]
    
    return entities


def _filter_facts_by_relevance(facts: List[Dict], query_entities: List[str]) -> List[Dict]:
    """
    Filter facts to only include those relevant to query entities.
    
    Args:
        facts: All cached facts
        query_entities: Entities extracted from current query (e.g., ['FPT', 'VNM'])
        
    Returns:
        Filtered list of relevant facts
    """
    if not query_entities:
        # No specific entities, return all facts
        return facts
    
    relevant = []
    for fact in facts:
        scope = fact.get("scope", "").upper()
        statement = fact.get("statement", fact.get("content", "")).upper()
        
        # Check if any query entity appears in scope or statement
        for entity in query_entities:
            entity_upper = entity.upper()
            if entity_upper in scope or entity_upper in statement:
                relevant.append(fact)
                break
    
    # If no relevant facts found, return top 5 facts as fallback
    if not relevant:
        logger.warning(f"[FastAnswer] No relevant facts found for entities {query_entities}, using top 5")
        return facts[:5]
    
    logger.info(f"[FastAnswer] Filtered to {len(relevant)} relevant facts from {len(facts)} total")
    return relevant
