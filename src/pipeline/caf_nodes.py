"""
CAF Pipeline Nodes - Canonical Answer Framework (Step 8).

Provides LangGraph nodes for the 2-pass CAF pipeline:
- extract_facts_node: Pass 1 - Extract canonical facts
- synthesize_answer_node: Pass 2 - Synthesize structured answer
"""
import time
import logging
from typing import Dict, Any

from .state import RAGState

logger = logging.getLogger(__name__)

def _log_step(state: RAGState, step: str, detail: str, metadata: Dict[str, Any] = None):
    """Add execution log to state."""
    import time
    if "logs" not in state:
        state["logs"] = []
    
    entry = {
        "step": step,
        "detail": detail,
        "timestamp": time.time() * 1000
    }
    if metadata:
        entry["metadata"] = metadata
    
    state["logs"].append(entry)


# =============================================================================
# LLM REFUSAL DETECTION - Patterns indicating LLM couldn't answer
# NOTE: Reduced patterns - only trigger for explicit refusals, not partial info
# =============================================================================
LLM_REFUSAL_PATTERNS = [
    "không thể đưa ra câu trả lời",
    "không có thông tin nào trong tài liệu",
    "không tìm thấy bất kỳ thông tin nào",
    "tôi không thể trả lời",
    "i cannot answer",
    "i don't have any information",
    "no information found",
]


def should_retry_with_fallback(answer: str) -> bool:
    """
    Check if LLM refused to answer, indicating fallback should be triggered.
    
    Args:
        answer: The generated answer text
        
    Returns:
        True if answer indicates refusal/inability to answer
    """
    if not answer:
        logger.debug("[REFUSAL CHECK] Empty answer - triggering fallback")
        return True
    
    answer_lower = answer.lower()
    logger.debug(f"[REFUSAL CHECK] Checking answer: {answer_lower[:200]}...")
    
    for pattern in LLM_REFUSAL_PATTERNS:
        if pattern.lower() in answer_lower:
            logger.info(f"[REFUSAL CHECK] ✓ Matched pattern: '{pattern}'")
            return True
    
    logger.debug("[REFUSAL CHECK] No refusal patterns matched")
    return False

# Cached CAF instances
_fact_extractor = None
_answer_synthesizer = None


def _log_separator(title: str = "", char: str = "=", length: int = 60):
    """Log a visual separator."""
    if title:
        padding = (length - len(title) - 2) // 2
        logger.info(f"{char * padding} {title} {char * padding}")
    else:
        logger.info(char * length)


def _truncate(text: str, max_len: int = 150) -> str:
    """Truncate text for logging."""
    if len(text) <= max_len:
        return text
    return text[:max_len] + "..."


def _get_fact_extractor():
    """Lazy load fact extractor."""
    global _fact_extractor
    if _fact_extractor is None:
        from src.core.generator import CanonicalFactExtractor
        _fact_extractor = CanonicalFactExtractor()
    return _fact_extractor


def _get_answer_synthesizer():
    """Lazy load answer synthesizer."""
    global _answer_synthesizer
    if _answer_synthesizer is None:
        from src.core.generator import CanonicalAnswerSynthesizer
        _answer_synthesizer = CanonicalAnswerSynthesizer()
    return _answer_synthesizer


def extract_facts_node(state: RAGState) -> RAGState:
    """
    CAF Pass 1: Extract canonical facts from retrieved contexts.
    
    This node takes the retrieved contexts and extracts structured facts
    following the Canonical Fact Schema.
    """
    _log_separator("CAF PASS 1: FACT EXTRACTION")
    start = time.time()
    
    extractor = _get_fact_extractor()
    
    # Get sub_query_contexts if available, otherwise use formatted_context
    sub_query_contexts = state.get("sub_query_contexts", {})
    
    # IMPORTANT: If fallback was used, include web contexts in the extraction
    if state.get("fallback_used") and state.get("web_contexts"):
        web_contexts = state.get("web_contexts", [])
        logger.info(f"[FALLBACK] Including {len(web_contexts)} web contexts in extraction")
        
        # Create a formatted context from web results
        web_context_text = ""
        for i, ctx in enumerate(web_contexts, 1):
            content = ctx.get("content", "")
            url = ctx.get("url", "Web Search")
            if content:
                web_context_text += f"\n[Web {i}] ({url}): {content}\n"
        
        # Add web context as a separate sub-query entry
        if web_context_text:
            sub_query_contexts["[Web Search Results]"] = web_context_text
            logger.info(f"[FALLBACK] Added web context ({len(web_context_text)} chars)")
    
    if not sub_query_contexts and state.get("formatted_context"):
        # Fallback: create single context from formatted_context
        sub_queries = state.get("sub_queries", [state["query"]])
        sub_query_contexts = {
            sub_queries[0] if sub_queries else state["query"]: state["formatted_context"]
        }
    
    logger.info(f"[INPUT] Sub-queries: {len(sub_query_contexts)}")
    for sq in sub_query_contexts.keys():
        logger.info(f"  - {_truncate(sq, 80)}")
    
    try:
        # Extract facts
        facts = extractor.extract(
            sub_query_contexts=sub_query_contexts,
            citations_map=state.get("citations_map", [])
        )
        
        # Store as list of dicts for serialization
        state["canonical_facts"] = [f.to_dict() for f in facts]
        
        logger.info(f"[OUTPUT] Canonical Facts Extracted: {len(facts)}")
        
        # Log facts by domain
        from src.core.generator import CanonicalFactList, FactDomain
        fact_list = CanonicalFactList(facts=list(facts))
        for domain in FactDomain:
            domain_facts = fact_list.filter_by_domain(domain)
            if domain_facts:
                logger.info(f"  - {domain.value}: {len(domain_facts)} facts")
        
        # Log sample facts
        for i, fact in enumerate(list(facts)[:3], 1):
            logger.info(f"[SAMPLE {i}] {fact}")
        
    except Exception as e:
        logger.error(f"[ERROR] Fact extraction failed: {e}")
        state["canonical_facts"] = []
        state["error"] = f"Fact extraction failed: {str(e)}"
    
    state["step_times"]["extract_facts"] = (time.time() - start) * 1000
    logger.info(f"[TIME] Fact Extraction: {state['step_times']['extract_facts']:.2f}ms")
    
    _log_step(state, "extract_facts", f"Extracted {len(facts)} canonical facts", {
        "count": len(facts)
    })
    
    return state


def synthesize_answer_node(state: RAGState) -> RAGState:
    """
    CAF Pass 2: Synthesize answer from canonical facts.
    
    This node takes the extracted canonical facts and synthesizes
    a structured answer following the Canonical Answer Structure.
    
    NEW: Auto-retry with fallback if LLM refusal detected.
    """
    _log_separator("CAF PASS 2: ANSWER SYNTHESIS")
    start = time.time()
    
    import os
    from src.core.fallback.rate_limiter import get_fallback_limiter
    
    synthesizer = _get_answer_synthesizer()
    
    # Reconstruct CanonicalFactList from state
    from src.core.generator import CanonicalFactList, CanonicalFact
    fact_dicts = state.get("canonical_facts", [])
    facts = CanonicalFactList(
        facts=[CanonicalFact.from_dict(f) for f in fact_dicts]
    )
    
    logger.info(f"[INPUT] Query: {_truncate(state['query'])}")
    logger.info(f"[INPUT] Canonical Facts: {len(facts)}")
    
    try:
        # Synthesize answer
        answer = synthesizer.synthesize(
            original_query=state["query"],
            facts=facts
        )
        
        state["answer"] = answer
        state["is_grounded"] = True
        
        # Extract citations used
        citations_used = synthesizer.extract_citations_used(answer)
        state["citations"] = [
            {"number": n, "used": True}
            for n in citations_used
        ]
        
        logger.info(f"[OUTPUT] Answer Length: {len(answer)} chars")
        logger.info(f"[OUTPUT] Citations Used: {citations_used}")
        logger.info(f"[OUTPUT] Answer Preview: {_truncate(answer, 300)}")
        
        # NEW: Check for LLM refusal and auto-retry with fallback
        if should_retry_with_fallback(answer):
            logger.warning("[REFUSAL DETECTED] LLM indicated it cannot answer.")
            
            # Check if fallback already used
            already_used_fallback = state.get("fallback_used", False)
            if already_used_fallback:
                logger.warning("Fallback already used - keeping refusal answer")
            else:
                # Check rate limit
                user_id = state.get("user_id", "anonymous")
                limiter = get_fallback_limiter(
                    limit_per_user=int(os.getenv("FALLBACK_RATE_LIMIT_PER_USER", "5")),
                    window_seconds=int(os.getenv("FALLBACK_RATE_LIMIT_WINDOW", "3600"))
                )
                
                rate_result = limiter.check_limit(user_id)
                
                if not rate_result.allowed:
                    logger.warning(
                        f"Fallback rate limit exceeded: "
                        f"{rate_result.current_count}/{rate_result.limit}"
                    )
                    state["rate_limit_exceeded"] = True
                    state["rate_limit_retry_after"] = rate_result.retry_after
                    # Keep refusal answer
                else:
                    # Trigger fallback and regenerate
                    logger.info(
                        f"Triggering fallback for refusal - "
                        f"rate: {rate_result.current_count}/{rate_result.limit}"
                    )
                    
                    # Run Google Search inline (sync version)
                    try:
                        from .nodes import _execute_google_search_sync
                        logger.info("Running Google Search for missing data...")
                        state = _execute_google_search_sync(state)
                        
                        # If we got web data, regenerate answer with it
                        web_contexts = state.get("web_contexts", [])
                        if web_contexts:
                            logger.info(
                                f"Got {len(web_contexts)} web results - "
                                f"regenerating answer..."
                            )
                            
                            # Re-extract facts with web context
                            extractor = _get_fact_extractor()
                            
                            # Combine original + web contexts
                            all_contexts = state.get("contexts", []) + web_contexts
                            
                            # Build sub_query_contexts for enriched extraction
                            enriched_sub_contexts = {}
                            for sub_q, sub_ctx in state.get("sub_query_contexts", {}).items():
                                enriched_sub_contexts[sub_q] = sub_ctx
                            
                            # Add web contexts to each sub-query context
                            if web_contexts:
                                web_text = "\n\n[WEB SEARCH RESULTS]\n" + "\n\n".join([
                                    f"[{i+1}] {ctx.get('title', 'N/A')}\n{ctx.get('content', '')}"
                                    for i, ctx in enumerate(web_contexts)
                                ])
                                for sub_q in enriched_sub_contexts:
                                    enriched_sub_contexts[sub_q] += web_text
                            
                            enriched_facts = extractor.extract(
                                sub_query_contexts=enriched_sub_contexts,
                                citations_map=state.get("citations_map", [])
                            )
                            
                            # Re-synthesize with enriched facts
                            new_answer = synthesizer.synthesize(
                                original_query=state["query"],
                                facts=enriched_facts
                            )
                            
                            state["answer"] = new_answer
                            state["canonical_facts"] = [f.to_dict() for f in enriched_facts.facts]
                            state["fallback_used"] = True
                            
                            logger.info(
                                f"Regenerated answer with fallback data: "
                                f"{len(new_answer)} chars"
                            )
                        else:
                            logger.warning("No web results from fallback - keeping original answer")
                            state["fallback_used"] = True  # Mark as used even if no results
                            
                    except Exception as fb_error:
                        logger.error(f"Fallback failed: {fb_error}")
                        state["fallback_error"] = str(fb_error)
                        # Keep original answer
        
    except Exception as e:
        logger.error(f"[ERROR] Answer synthesis failed: {e}")
        state["answer"] = f"Đã xảy ra lỗi khi tổng hợp câu trả lời: {str(e)}"
        state["is_grounded"] = False
        state["error"] = f"Answer synthesis failed: {str(e)}"
    
    state["step_times"]["synthesize"] = (time.time() - start) * 1000
    
    # Calculate total time
    state["total_time_ms"] = sum(state["step_times"].values())
    
    # Final summary
    _log_separator("CAF PIPELINE SUMMARY")
    logger.info(f"Total Time: {state['total_time_ms']:.2f}ms")
    logger.info("Time Breakdown:")
    for step, time_ms in state["step_times"].items():
        pct = (time_ms / state["total_time_ms"] * 100) if state["total_time_ms"] > 0 else 0
        logger.info(f"  - {step:15s}: {time_ms:8.2f}ms ({pct:5.1f}%)")
    
    logger.info(f"[TIME] Synthesis: {state['step_times']['synthesize']:.2f}ms")
    
    return state


def _format_web_answer(state: RAGState) -> str:
    """
    Format answer directly from web search results.
    Used for simple temporal queries where web data is sufficient.
    """
    web_contexts = state.get("web_contexts", [])
    query = state.get("query", "")
    
    # Sort contexts: Summary first, then others
    summary_ctx = next((c for c in web_contexts if c.get("source_type") == "web_summary"), None)
    findings = [c for c in web_contexts if c.get("source_type") != "web_summary"]
    
    if not summary_ctx and not findings:
        return None
    
    parts = []
    
    # 1. Add Summary if available
    if summary_ctx:
        parts.append(f"🔍 **Tổng hợp nhanh:**\n{summary_ctx.get('content', '')}")
    
    # 2. Add Key Findings
    if findings:
        parts.append("\n💡 **Thông tin chi tiết:**")
        for i, ctx in enumerate(findings[:8], 1):  # Limit findings
            content = ctx.get("content", "").strip()
            title = ctx.get("title", "Web Source")
            if content:
                parts.append(f"• {content} [{i}]")
    
    # 3. Add Sources footer
    if findings:
        parts.append("\n📚 **Nguồn tham khảo:**")
        for i, ctx in enumerate(findings[:5], 1):
            url = ctx.get("url", "#")
            title = ctx.get("title", "Nguồn web")
            parts.append(f"[{i}] [{title}]({url})")
            
    return "\n".join(parts)


def generate_node_caf(state: RAGState) -> RAGState:
    """
    CAF-enabled generation node (combines extract + synthesize).
    
    This is a convenience node that runs both CAF passes in sequence.
    Use this as a drop-in replacement for generate_node in the graph.
    
    FAST PATH: For simple queries with good web data, skip CAF and use web directly.
    """
    import time
    start_total = time.time()
    
    _log_separator("CAF GENERATION (2-PASS)")
    
    # FAST PATH: If fallback was used with good web data for simple query,
    # use web data directly instead of complex CAF pipeline
    is_simple = not state.get("is_complex", False)
    has_web_data = state.get("fallback_used") and state.get("web_contexts")
    
    if is_simple and has_web_data:
        web_contexts = state.get("web_contexts", [])
        if len(web_contexts) >= 1:
            logger.info("[FAST PATH] Simple query with web data - using direct answer")
            
            # Format answer directly from web data
            web_answer = _format_web_answer(state)
            
            if web_answer:
                state["answer"] = web_answer
                state["is_grounded"] = True
                state["citations"] = [{"number": f"Web {i}", "used": True} for i in range(1, min(len(web_contexts), 6))]
                state["step_times"]["extract_facts"] = 0.0
                state["step_times"]["synthesize"] = (time.time() - start_total) * 1000
                state["total_time_ms"] = sum(state["step_times"].values())
                
                logger.info(f"[OUTPUT] Answer Length: {len(web_answer)} chars")
                logger.info(f"[OUTPUT] Answer Preview: {_truncate(web_answer, 300)}")
                
                # Final summary
                _log_separator("CAF PIPELINE SUMMARY (FAST PATH)")
                logger.info(f"Total Time: {state['total_time_ms']:.2f}ms")
                logger.info("Time Breakdown:")
                for step, time_ms in state["step_times"].items():
                    pct = (time_ms / state["total_time_ms"] * 100) if state["total_time_ms"] > 0 else 0
                    logger.info(f"  - {step:15s}: {time_ms:8.2f}ms ({pct:5.1f}%)")
                
                return state
    
    # STANDARD PATH: Full CAF 2-pass for complex queries
    logger.info("[STANDARD PATH] Using full CAF 2-pass generation")
    
    # Pass 1: Extract facts
    state = extract_facts_node(state)
    
    # Check for errors
    if state.get("error"):
        logger.warning(f"[CAF] Error in fact extraction: {state['error']}")
        # Still try to synthesize with empty facts (will give helpful error message)
    
    # Pass 2: Synthesize answer
    state = synthesize_answer_node(state)
    
    return state
