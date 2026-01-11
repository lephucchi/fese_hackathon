"""
LangGraph Node Functions for RAG Pipeline.

Each node transforms the state and returns the updated state.
With comprehensive logging for debugging and pipeline analysis.

Updated for Canonical Answer Framework (CAF) - Step 8.
"""
import time
import logging
from typing import Dict, Any

from .state import RAGState

# Configure detailed logger
logger = logging.getLogger(__name__)

# Cached instances (lazy loaded)
_router = None
_decomposer = None
_retriever = None
_fusion = None
_generator = None
_classifier = None


def _get_classifier():
    global _classifier
    if _classifier is None:
        from src.core.decomposition import QueryComplexityClassifier
        _classifier = QueryComplexityClassifier()
    return _classifier


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


def _get_router():
    global _router
    if _router is None:
        from src.core.router import HybridRouter
        _router = HybridRouter()
    return _router


def _get_decomposer():
    global _decomposer
    if _decomposer is None:
        from src.core.decomposition import QueryDecomposer
        _decomposer = QueryDecomposer()
    return _decomposer


def _get_retriever():
    global _retriever
    if _retriever is None:
        from src.core.retrieval import ParallelRetriever
        _retriever = ParallelRetriever()
    return _retriever


def _get_fusion():
    global _fusion
    if _fusion is None:
        from src.core.retrieval import ResultFusion
        _fusion = ResultFusion()
    return _fusion


def _get_generator():
    global _generator
    if _generator is None:
        from src.core.generator import GroundedGenerator
        _generator = GroundedGenerator()
    return _generator


def _log_step(state: RAGState, step: str, detail: str, metadata: Dict[str, Any] = None):
    """Add execution log to state."""
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


def route_node(state: RAGState) -> RAGState:
    """
    Step 1: Route the query to appropriate indices.
    
    Uses user_query (original query) for routing if available,
    to avoid confusion from augmented context.
    """
    start = time.time()
    
    # IMPORTANT: Use original user query for routing, not augmented query
    # The augmented query contains chat history + news which confuses the router
    query_for_routing = state.get("user_query") or state["query"]
    full_query = state["query"]  # Keep full query for logging
    
    logger.info(f"===================== STEP 1: ROUTING =====================")
    logger.info(f"[INPUT] Query for routing: {_truncate(query_for_routing, 100)}")
    if state.get("user_query"):
        logger.info(f"[INFO] Using original user_query (ignoring augmented context)")
    _log_step(state, "route", "Analyzing query intent...", {"query": query_for_routing})
    
    router = _get_router()
    routes, scores = router.route(query_for_routing)
    
    state["routes"] = routes
    state["route_scores"] = scores
    
    # Check complexity using original query
    classifier = _get_classifier()
    classification = classifier.classify(query_for_routing)
    
    is_complex = classification.is_complex
    reason = classification.reason
    score = classification.complexity_score
    
    state["is_complex"] = is_complex
    
    state["step_times"]["route"] = (time.time() - start) * 1000
    
    log_detail = f"Selected indices: {', '.join(routes)}"
    _log_step(state, "route", log_detail, {
        "routes": routes, 
        "scores": scores,
        "is_complex": is_complex
    })
    
    logger.info(f"[OUTPUT] Selected Routes: {routes}")
    logger.info(f"[OUTPUT] All Scores:")
    for r, s in scores.items():
        logger.info(f"  - {r:12s}: {s:.3f} {'#' * int(s*20)}")
    logger.info(f"[TIME] Route: {state['step_times']['route']:.2f}ms")
    logger.info(f"[CLASSIFY] Query: {_truncate(query_for_routing, 100)}")
    logger.info(f"[CLASSIFY] Is Complex: {is_complex}")
    logger.info(f"[CLASSIFY] Score: {score:.2f}")
    logger.info(f"[CLASSIFY] Reason: {reason}")
    
    return state


def decompose_node(state: RAGState) -> RAGState:
    """
    Decompose complex query into sub-queries.
    
    Uses user_query (original query) for decomposition if available,
    to avoid confusion from augmented context.
    """
    logger.info(f"================== STEP 2: DECOMPOSITION ==================")
    _log_step(state, "decompose", "Breaking down complex query...")
    
    decomposer = _get_decomposer()
    start = time.time()
    
    # IMPORTANT: Use original user query for decomposition
    query_for_decomp = state.get("user_query") or state["query"]
    logger.info(f"[INPUT] Query: {_truncate(query_for_decomp, 100)}")
    if state.get("user_query"):
        logger.info(f"[INFO] Using original user_query for decomposition")
    
    result = decomposer.decompose(query_for_decomp)
    
    state["is_complex"] = result.is_decomposed
    state["sub_queries"] = [sq.query for sq in result.sub_queries]
    state["sub_query_types"] = [sq.query_type for sq in result.sub_queries]
    state["step_times"]["decompose"] = (time.time() - start) * 1000
    
    # Detailed logging
    logger.info(f"[OUTPUT] Is Decomposed: {result.is_decomposed}")
    logger.info(f"[OUTPUT] Method: {result.method}")
    logger.info(f"[OUTPUT] Sub-queries ({len(result.sub_queries)}):")
    for i, sq in enumerate(result.sub_queries, 1):
        logger.info(f"  [{i}] Type: {sq.query_type}")
        logger.info(f"      Query: {_truncate(sq.query, 100)}")
    if result.reasoning:
        logger.info(f"[OUTPUT] Reasoning: {_truncate(result.reasoning, 200)}")
    logger.info(f"[TIME] Decompose: {state['step_times']['decompose']:.2f}ms")
    
    return state


async def retrieve_node(state: RAGState) -> RAGState:
    """Retrieve documents for sub-queries (async version)."""
    _log_separator("STEP 3: RETRIEVAL")
    _log_step(state, "retrieve", "Retrieving documents...")
    retriever = _get_retriever()
    fusion = _get_fusion()
    start = time.time()
    
    # Import translator for cross-lingual retrieval
    from src.core.retrieval import get_translator
    translator = get_translator()
    
    # Map sub-queries to routes
    sub_queries = state["sub_queries"] or [state["query"]]
    sub_query_types = state.get("sub_query_types", [])
    
    # Check if decomposition failed (single query with UNKNOWN type)
    decomposition_failed = (
        len(sub_queries) == 1 and
        len(sub_query_types) >= 1 and
        sub_query_types[0] == "UNKNOWN"
    )
    
    # IMPORTANT: Get original user query for fallback cases
    original_user_query = state.get("user_query") or state["query"]
    
    if decomposition_failed:
        # When decomposition fails, query ALL routes selected by router
        # This ensures we don't miss relevant documents from other indices
        all_routes = state["routes"]
        logger.info(f"[FALLBACK] Decomposition failed, querying ALL routes: {all_routes}")
        
        # Use original user query (not augmented with chat history) for all routes
        sub_queries = [original_user_query] * len(all_routes)
        routes = all_routes
    else:
        # Normal case: map sub-queries to their respective routes
        routes = []
        for i, sq_type in enumerate(sub_query_types):
            if sq_type and sq_type != "UNKNOWN":
                routes.append(sq_type.lower())
            elif i < len(state["routes"]):
                routes.append(state["routes"][i])
            else:
                routes.append(state["routes"][0] if state["routes"] else "financial")
        
        # Ensure routes matches sub_queries length
        while len(routes) < len(sub_queries):
            routes.append(routes[0] if routes else "financial")
            
        # Coverage Check: Ensure all high-confidence router selections are queried
        # This fixes the issue where decomposition misses an index that the router correctly identified
        covered = set(routes)
        unique_missing = [r for r in state["routes"] if r not in covered]
        
        # IMPORTANT: Use original user query for coverage, not augmented query with chat history
        original_query = state.get("user_query") or state["query"]
        for r in unique_missing:
            logger.info(f"[COVERAGE] Adding missing route '{r}' with original user query")
            sub_queries.append(original_query)
            routes.append(r)
    
    # Translate queries for glossary index (Vietnamese -> English)
    translated_queries = []
    for sq, route in zip(sub_queries, routes[:len(sub_queries)]):
        if route == "glossary" and translator.is_available:
            translated = translator.translate_for_index(sq, "glossary")
            translated_queries.append(translated)
            if translated != sq:
                logger.info(f"[TRANSLATE] '{sq}' -> '{translated}'")
        else:
            translated_queries.append(sq)
    
    # Log retrieval plan
    logger.info("[INPUT] Retrieval Plan:")
    for i, (sq, tq, route) in enumerate(zip(sub_queries, translated_queries, routes[:len(sub_queries)]), 1):
        logger.info(f"  [{i}] Query: {_truncate(sq, 80)}")
        if tq != sq:
            logger.info(f"      Translated: {_truncate(tq, 80)}")
        logger.info(f"      -> Index: {route}")
    
    # Retrieve with translated queries
    result = await retriever.retrieve_all_async(translated_queries, routes[:len(translated_queries)])
    
    logger.info(f"[OUTPUT] Documents Retrieved: {len(result.documents)}")
    logger.info(f"[OUTPUT] Retrieval Time: {result.total_time_ms:.2f}ms")
    
    # Log top documents
    logger.info("[OUTPUT] Top Documents Preview:")
    for i, doc in enumerate(result.documents[:5], 1):
        logger.info(f"  [{i}] Source: {doc.source_index} | Score: {doc.similarity:.3f}")
        logger.info(f"      Content: {_truncate(doc.content, 120)}")
    if len(result.documents) > 5:
        logger.info(f"  ... and {len(result.documents) - 5} more documents")
    
    # Fuse for original formatted_context
    fused = fusion.merge(result.documents)
    
    logger.info(f"[OUTPUT] After Fusion: {len(fused.documents)} documents")
    logger.info(f"[OUTPUT] Context Length: {len(fused.formatted_context)} chars")
    logger.info(f"[OUTPUT] Citations: {len(fused.citations)} entries")
    
    state["contexts"] = [doc.to_dict() for doc in fused.documents]
    state["formatted_context"] = fused.formatted_context
    state["citations_map"] = fused.citations
    
    # CAF: Also create sub_query_contexts using format_by_sub_query
    # This preserves the relationship between sub-queries and documents for CFE
    if result.sub_query_results:
        sub_query_contexts, caf_citations = fusion.format_by_sub_query(result.sub_query_results)
        
        # IMPORTANT: Map translated query keys back to original Vietnamese queries
        # This ensures fact extraction sees the original user intent
        # Build mapping: translated_query -> original_query (handle duplicates)
        translated_to_original = {}
        for tq, sq in zip(translated_queries, sub_queries):
            if tq != sq:  # Only map if actually translated
                translated_to_original[tq] = sq
        
        if translated_to_original:
            remapped_contexts = {}
            for query_key, context in sub_query_contexts.items():
                # Map back to original if this was a translated key
                original_key = translated_to_original.get(query_key, query_key)
                # Merge contexts if same original query (from multiple routes)
                if original_key in remapped_contexts:
                    remapped_contexts[original_key] += "\n\n" + context
                else:
                    remapped_contexts[original_key] = context
            sub_query_contexts = remapped_contexts
            logger.info(f"[CAF] Remapped translated keys, now {len(sub_query_contexts)} unique contexts")
        
        state["sub_query_contexts"] = sub_query_contexts
        # Update citations_map with sub_query info
        state["citations_map"] = caf_citations
        logger.info(f"[CAF] Sub-query contexts: {len(sub_query_contexts)} entries")
    else:
        # Fallback: create single context entry using ORIGINAL query, not augmented
        original_query = state.get("user_query") or state["query"]
        state["sub_query_contexts"] = {original_query: fused.formatted_context}
        logger.info("[CAF] Using fallback single context")
    
    state["step_times"]["retrieve"] = (time.time() - start) * 1000
    
    logger.info(f"[TIME] Retrieve + Fusion: {state['step_times']['retrieve']:.2f}ms")
    
    _log_step(state, "retrieve", f"Retrieved {len(fused.documents)} documents", {
        "count": len(fused.documents),
        "time": state['step_times']['retrieve']
    })
    
    return state


def generate_node(state: RAGState) -> RAGState:
    """Generate grounded answer with citations."""
    _log_separator("STEP 4: GENERATION")
    generator = _get_generator()
    start = time.time()
    
    query = state["query"]
    context_len = len(state["formatted_context"])
    citations_count = len(state["citations_map"])
    
    logger.info(f"[INPUT] Query: {_truncate(query)}")
    logger.info(f"[INPUT] Context Length: {context_len} chars")
    logger.info(f"[INPUT] Available Citations: {citations_count}")
    
    result = generator.generate(
        query=query,
        context=state["formatted_context"],
        citations_map=state["citations_map"]
    )
    
    state["answer"] = result.answer
    state["citations"] = [
        {"number": n, "used": True}
        for n in result.citations_used
    ]
    state["is_grounded"] = result.is_grounded
    state["step_times"]["generate"] = (time.time() - start) * 1000
    
    # Calculate total time
    state["total_time_ms"] = sum(state["step_times"].values())
    
    # Detailed logging
    logger.info(f"[OUTPUT] Is Grounded: {result.is_grounded}")
    logger.info(f"[OUTPUT] Citations Used: {result.citations_used}")
    logger.info(f"[OUTPUT] Answer Preview: {_truncate(result.answer, 300)}")
    logger.info(f"[TIME] Generate: {state['step_times']['generate']:.2f}ms")
    
    # Final summary
    _log_separator("PIPELINE SUMMARY")
    logger.info(f"Total Time: {state['total_time_ms']:.2f}ms")
    logger.info("Time Breakdown:")
    for step, time_ms in state["step_times"].items():
        pct = (time_ms / state["total_time_ms"] * 100) if state["total_time_ms"] > 0 else 0
        logger.info(f"  - {step:12s}: {time_ms:8.2f}ms ({pct:5.1f}%)")
    
    return state


def should_decompose(state: RAGState) -> bool:
    """Determine if query needs decomposition."""
    from src.core.decomposition import QueryComplexityClassifier
    classifier = QueryComplexityClassifier()
    result = classifier.classify(state["query"])
    
    logger.info(f"[CLASSIFY] Query: {_truncate(state['query'], 80)}")
    logger.info(f"[CLASSIFY] Is Complex: {result.is_complex}")
    logger.info(f"[CLASSIFY] Score: {result.complexity_score:.2f}")
    logger.info(f"[CLASSIFY] Reason: {result.reason}")
    
    return result.is_complex


# ============================================================================
# FALLBACK NODES (Step 9)
# ============================================================================

# Cached fallback instances
_fallback_decider = None
_google_search = None


def _get_fallback_decider():
    """Lazy load fallback decider."""
    global _fallback_decider
    if _fallback_decider is None:
        from src.core.fallback import FallbackDecider
        _fallback_decider = FallbackDecider()
    return _fallback_decider


def _get_google_search():
    """Lazy load Google search grounding."""
    global _google_search
    if _google_search is None:
        from src.core.fallback import GoogleSearchGrounding
        _google_search = GoogleSearchGrounding()
    return _google_search


def fallback_check_node(state: RAGState) -> RAGState:
    """
    Check if fallback to external search is needed.
    
    Analyzes retrieval results and decides whether to trigger
    Google Search grounding for additional context.
    
    Updated with Rate Limiting (Phase 4).
    """
    _log_separator("STEP 3.5: FALLBACK CHECK + RATE LIMIT")
    start = time.time()
    
    import os
    from src.core.fallback.rate_limiter import get_fallback_limiter
    
    decider = _get_fallback_decider()
    
    # CRITICAL: Use original user query for fallback detection, not augmented query
    # Augmented query contains chat history which may have temporal keywords
    query_for_fallback = state.get("user_query", state["query"])
    contexts = state.get("contexts", [])
    routes = state.get("routes", [])
    user_id = state.get("user_id", "anonymous")
    
    logger.info(f"[INPUT] Query: {_truncate(query_for_fallback)}")
    logger.info(f"[INPUT] Retrieved Contexts: {len(contexts)}")
    logger.info(f"[INPUT] Routes: {routes}")
    logger.info(f"[INPUT] User ID: {user_id}")
    
    # Make fallback decision using ORIGINAL user query
    decision = decider.decide(query_for_fallback, contexts, routes)
    
    # SECURITY: Check rate limit if fallback is needed
    if decision.should_fallback:
        limiter = get_fallback_limiter(
            limit_per_user=int(os.getenv("FALLBACK_RATE_LIMIT_PER_USER", "5")),
            window_seconds=int(os.getenv("FALLBACK_RATE_LIMIT_WINDOW", "3600"))
        )
        
        rate_result = limiter.check_limit(user_id)
        
        if not rate_result.allowed:
            logger.warning(
                f"Fallback rate limit exceeded for user {user_id}: "
                f"{rate_result.reason}"
            )
            
            # Override decision - don't fallback
            decision.should_fallback = False
            decision.details = (
                f"Rate limit: {rate_result.current_count}/{rate_result.limit}. "
                f"Retry after {rate_result.retry_after}s"
            )
            
            state["rate_limit_exceeded"] = True
            state["rate_limit_retry_after"] = rate_result.retry_after
        else:
            logger.info(f"Rate limit OK: {rate_result.current_count}/{rate_result.limit}")
            state["rate_limit_exceeded"] = False
    
    state["fallback_decision"] = decision.to_dict()
    state["step_times"]["fallback_check"] = (time.time() - start) * 1000
    
    logger.info(f"[OUTPUT] Should Fallback: {decision.should_fallback}")
    logger.info(f"[OUTPUT] Reason: {decision.reason.value}")
    logger.info(f"[OUTPUT] Max Score: {decision.max_similarity_score:.3f}")
    logger.info(f"[OUTPUT] Doc Count: {decision.doc_count}")
    if decision.details:
        logger.info(f"[OUTPUT] Details: {decision.details}")
    logger.info(f"[TIME] Fallback Check: {state['step_times']['fallback_check']:.2f}ms")
    
    _log_step(state, "fallback_check", 
              f"Fallback: {decision.should_fallback} ({decision.reason.value})", 
              decision.to_dict())
    
    return state


def _execute_google_search_sync(state: RAGState) -> RAGState:
    """
    Synchronous version of Google Search for inline fallback.
    
    Used when we need to run fallback from sync context
    (e.g., within synthesize_answer_node).
    """
    _log_separator("INLINE GOOGLE SEARCH")
    start = time.time()
    
    search = _get_google_search()
    
    query = state["query"]
    sub_queries = state.get("sub_queries", [])
    
    logger.info(f"[INPUT] Query: {_truncate(query)}")
    logger.info(f"[INPUT] Sub-queries: {len(sub_queries)}")
    
    # Execute search (this is sync)
    result = search.search(query, sub_queries)
    
    state["web_contexts"] = result.get("web_contexts", [])
    state["fallback_used"] = result.get("fallback_used", True)
    state["fallback_error"] = result.get("fallback_error")
    
    elapsed = (time.time() - start) * 1000
    if "step_times" not in state:
        state["step_times"] = {}
    state["step_times"]["google_search_inline"] = elapsed
    
    logger.info(f"[OUTPUT] Web Contexts: {len(state['web_contexts'])}")
    logger.info(f"[OUTPUT] Fallback Used: {state['fallback_used']}")
    if state["fallback_error"]:
        logger.warning(f"[OUTPUT] Error: {state['fallback_error']}")
    logger.info(f"[TIME] Inline Search: {elapsed:.2f}ms")
    
    return state


async def google_search_node(state: RAGState) -> RAGState:
    """
    Execute Google Search grounding for external knowledge.
    
    Uses Gemini with Google Search tool binding to retrieve
    real-time information from the web.
    """
    _log_separator("STEP 3.6: GOOGLE SEARCH")
    start = time.time()
    
    search = _get_google_search()
    
    query = state["query"]
    sub_queries = state.get("sub_queries", [])
    
    logger.info(f"[INPUT] Query: {_truncate(query)}")
    logger.info(f"[INPUT] Sub-queries: {len(sub_queries)}")
    
    # Execute search
    result = search.search(query, sub_queries)
    
    state["web_contexts"] = result.get("web_contexts", [])
    state["fallback_used"] = result.get("fallback_used", True)
    state["fallback_error"] = result.get("fallback_error")
    state["step_times"]["google_search"] = (time.time() - start) * 1000
    
    logger.info(f"[OUTPUT] Web Contexts: {len(state['web_contexts'])}")
    logger.info(f"[OUTPUT] Fallback Used: {state['fallback_used']}")
    if state["fallback_error"]:
        logger.warning(f"[OUTPUT] Error: {state['fallback_error']}")
    
    # Log web contexts preview
    for i, ctx in enumerate(state["web_contexts"][:3], 1):
        logger.info(f"  [{i}] Source: {ctx.get('url', 'N/A')}")
        logger.info(f"      Content: {_truncate(ctx.get('content', ''), 100)}")
    
    logger.info(f"[TIME] Google Search: {state['step_times']['google_search']:.2f}ms")
    
    _log_step(state, "google_search", f"Found {len(state['web_contexts'])} web results", {
        "count": len(state['web_contexts'])
    })
    
    # Merge web contexts into main contexts for generation
    if state["web_contexts"]:
        # Add web contexts to main contexts list
        for web_ctx in state["web_contexts"]:
            # Mark as web source in metadata
            web_ctx["metadata"] = web_ctx.get("metadata", {})
            web_ctx["metadata"]["source_type"] = "web"
        
        state["contexts"].extend(state["web_contexts"])
        
        # Update formatted_context to include web results
        web_context_text = "\n\n--- Web Search Results ---\n"
        for i, ctx in enumerate(state["web_contexts"], 1):
            url = ctx.get("url", "Web Search")
            content = ctx.get("content", "")
            web_context_text += f"\n[Web {i}] ({url}):\n{content}\n"
        
        state["formatted_context"] += web_context_text
        
        logger.info(f"[OUTPUT] Total Contexts After Merge: {len(state['contexts'])}")
    
    return state


def should_fallback(state: RAGState) -> bool:
    """
    Conditional function to determine if fallback path should be taken.
    
    Used by LangGraph for conditional edge routing.
    """
    decision = state.get("fallback_decision", {})
    should_fb = decision.get("should_fallback", False)
    
    logger.info(f"[CONDITIONAL] Should Fallback: {should_fb}")
    return should_fb


def post_generation_fallback_check_node(state: RAGState) -> RAGState:
    """
    Check if fallback is needed AFTER generation.
    
    This catches cases where:
    - LLM refuses to answer despite having contexts
    - Answer quality is too low
    - Answer indicates missing information
    
    This is a second-pass fallback check after seeing the generated answer.
    """
    _log_separator("POST-GENERATION FALLBACK CHECK")
    start = time.time()
    
    import os
    from src.core.fallback.rate_limiter import get_fallback_limiter
    
    decider = _get_fallback_decider()
    
    query = state["query"]
    contexts = state.get("contexts", [])
    routes = state.get("routes", [])
    answer = state.get("answer", "")
    user_id = state.get("user_id", "anonymous")
    
    # Check if already used fallback
    already_used_fallback = state.get("fallback_used", False)
    if already_used_fallback:
        logger.info("Fallback already used - skipping post-check")
        state["post_fallback_check_time"] = (time.time() - start) * 1000
        return state
    
    logger.info(f"[INPUT] Query: {_truncate(query)}")
    logger.info(f"[INPUT] Answer length: {len(answer)} chars")
    logger.info(f"[INPUT] Answer preview: {_truncate(answer, 100)}")
    
    # Make decision WITH generated answer
    decision = decider.decide(
        query=query,
        contexts=contexts,
        routes=routes,
        generated_answer=answer  # Pass answer for refusal detection
    )
    
    # If refusal detected, check rate limit and trigger fallback
    if decision.should_fallback and decision.reason == "LLM_REFUSAL":
        logger.warning(
            f"LLM refusal detected in answer - attempting fallback"
        )
        
        # Check rate limit
        limiter = get_fallback_limiter(
            limit_per_user=int(os.getenv("FALLBACK_RATE_LIMIT_PER_USER", "5")),
            window_seconds=int(os.getenv("FALLBACK_RATE_LIMIT_WINDOW", "3600"))
        )
        
        rate_result = limiter.check_limit(user_id)
        
        if not rate_result.allowed:
            logger.warning(
                f"Fallback rate limit exceeded for user {user_id}: "
                f"{rate_result.reason}"
            )
            decision.should_fallback = False
            decision.details = (
                f"LLM refusal detected but rate limited: "
                f"{rate_result.current_count}/{rate_result.limit}. "
                f"Retry after {rate_result.retry_after}s"
            )
            state["rate_limit_exceeded"] = True
            state["rate_limit_retry_after"] = rate_result.retry_after
        else:
            logger.info(
                f"Fallback approved for refusal - "
                f"rate limit OK: {rate_result.current_count}/{rate_result.limit}"
            )
            state["rate_limit_exceeded"] = False
    
    state["post_generation_fallback_decision"] = decision.to_dict()
    state["post_fallback_check_time"] = (time.time() - start) * 1000
    
    logger.info(f"[OUTPUT] Should Retry with Fallback: {decision.should_fallback}")
    logger.info(f"[OUTPUT] Reason: {decision.reason.value}")
    if decision.details:
        logger.info(f"[OUTPUT] Details: {decision.details}")
    logger.info(f"[TIME] Post-fallback Check: {state['post_fallback_check_time']:.2f}ms")
    
    return state


def should_retry_with_fallback(state: RAGState) -> bool:
    """
    Conditional function to check if we should retry with fallback
    after generation.
    
    Used by LangGraph for post-generation conditional routing.
    """
    post_decision = state.get("post_generation_fallback_decision", {})
    should_retry = post_decision.get("should_fallback", False)
    
    logger.info(f"[CONDITIONAL] Should Retry with Fallback: {should_retry}")
    return should_retry
