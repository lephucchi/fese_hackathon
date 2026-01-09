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

# =============================================================================
# LLM REFUSAL DETECTION - Patterns indicating LLM couldn't answer
# =============================================================================
LLM_REFUSAL_PATTERNS = [
    "không thể đưa ra câu trả lời",
    "không tìm thấy thông tin",
    "không có đủ dữ liệu",
    "không thể trả lời",
    "tôi không có thông tin",
    "mình chưa có thông tin",
    "không có trong tài liệu",
    "không được cung cấp",
    "chưa có dữ liệu",
    "không đủ thông tin để trả lời",
    "i cannot answer",
    "i don't have information",
    "not found in the provided",
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
        return True
    
    answer_lower = answer.lower()
    for pattern in LLM_REFUSAL_PATTERNS:
        if pattern.lower() in answer_lower:
            return True
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
    
    return state


def synthesize_answer_node(state: RAGState) -> RAGState:
    """
    CAF Pass 2: Synthesize answer from canonical facts.
    
    This node takes the extracted canonical facts and synthesizes
    a structured answer following the Canonical Answer Structure.
    """
    _log_separator("CAF PASS 2: ANSWER SYNTHESIS")
    start = time.time()
    
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
        
        # Check for LLM refusal - trigger fallback if needed
        if should_retry_with_fallback(answer):
            logger.warning("[REFUSAL DETECTED] LLM indicated it cannot answer. Flagging for fallback.")
            state["llm_refusal_detected"] = True
            state["fallback_reason"] = "LLM_REFUSAL"
            # Note: The pipeline graph should check this flag and route to fallback
        
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
    
    # Build answer from web contexts
    facts = []
    for ctx in web_contexts:
        content = ctx.get("content", "")
        if content:
            facts.append(content)
    
    if not facts:
        return None
    
    # Create simple, direct answer
    answer_parts = []
    for i, fact in enumerate(facts[:5], 1):  # Limit to 5 facts
        answer_parts.append(f"{fact} [Web {i}]")
    
    return " ".join(answer_parts)


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
