"""
Quick Test - Single Query with Full Pipeline.

Usage:
    python test/test_quick.py "Your query here"
    python test/test_quick.py "ROE là gì?"
    python test/test_quick.py "So sánh VNM và VCB"
"""
import sys
import os
import asyncio
import time
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.pipeline import run_rag_pipeline_async
from src.core.security import get_query_guard


async def test_single_query(query: str, user_id: str = "test_user"):
    """Test a single query through full pipeline."""
    print("\n" + "=" * 70)
    print("🚀 RAG Pipeline Test - Single Query")
    print("=" * 70)
    
    print(f"\n📝 Query: {query}")
    print(f"👤 User ID: {user_id}")
    
    # Step 1: Security check
    print("\n🔒 Step 1: Security Check")
    guard = get_query_guard()
    security_result = guard.check(query)
    
    if not security_result.is_safe:
        print(f"   ❌ BLOCKED by Query Guard")
        print(f"   Risk Level: {security_result.risk_level.value}")
        print(f"   Reason: {security_result.reason}")
        if security_result.suggestions:
            print(f"   Suggestion: {security_result.suggestions}")
        print(f"\n⛔ Query blocked. Pipeline not executed.")
        return
    
    print(f"   ✅ Security passed")
    print(f"   Risk: {security_result.risk_level.value}")
    print(f"   Finance score: {guard._calculate_finance_score(query.lower()):.2f}")
    
    # Step 2: Run pipeline
    print("\n🚀 Step 2: Running RAG Pipeline...")
    start = time.time()
    
    try:
        result = await run_rag_pipeline_async(query, user_id=user_id)
        elapsed = time.time() - start
        
        print(f"\n✅ Pipeline completed in {elapsed:.2f}s")
        
        # Display results
        print("\n" + "=" * 70)
        print("📊 RESULTS")
        print("=" * 70)
        
        print(f"\n💬 Answer:")
        print(f"{result['answer']}\n")
        
        print(f"📍 Metadata:")
        print(f"  - Routes: {result['routes']}")
        print(f"  - Complex query: {result.get('is_complex', False)}")
        print(f"  - Sub-queries: {len(result.get('sub_queries', []))}")
        
        if result.get('sub_queries'):
            for i, sq in enumerate(result['sub_queries'], 1):
                print(f"    {i}. {sq}")
        
        print(f"  - Grounded: {result['is_grounded']}")
        print(f"  - Citations: {len(result.get('citations_map', []))}")
        
        # Fallback info
        print(f"\n🔍 Fallback Info:")
        fallback_used = result.get('fallback_used', False)
        rate_limited = result.get('rate_limit_exceeded', False)
        
        print(f"  - Fallback triggered: {fallback_used}")
        if fallback_used:
            web_contexts = result.get('web_contexts', [])
            print(f"  - Web search results: {len(web_contexts)}")
        
        print(f"  - Rate limited: {rate_limited}")
        if rate_limited:
            retry_after = result.get('rate_limit_retry_after')
            print(f"  - Retry after: {retry_after}s")
        
        # Performance breakdown
        step_times = result.get('step_times', {})
        if step_times:
            print(f"\n⏱️  Performance Breakdown:")
            total_ms = sum(step_times.values())
            for step, ms in sorted(step_times.items(), key=lambda x: x[1], reverse=True):
                percentage = (ms / total_ms * 100) if total_ms > 0 else 0
                print(f"  - {step:20s}: {ms:7.0f}ms ({percentage:5.1f}%)")
            print(f"  {'─' * 44}")
            print(f"  {'TOTAL':20s}: {total_ms:7.0f}ms (100.0%)")
        
        # CAF info (if enabled)
        canonical_facts = result.get('canonical_facts', [])
        if canonical_facts:
            print(f"\n📚 Canonical Facts (CAF):")
            for i, fact in enumerate(canonical_facts[:3], 1):  # Show first 3
                print(f"  {i}. {fact.get('fact', 'N/A')}")
            if len(canonical_facts) > 3:
                print(f"  ... and {len(canonical_facts) - 3} more")
        
        # Citations
        citations = result.get('citations_map', [])
        if citations:
            print(f"\n📖 Citations:")
            for i, citation in enumerate(citations[:3], 1):
                print(f"  [{i}] {citation.get('source', 'Unknown')}")
                content = citation.get('content', '')
                print(f"      {content[:80]}...")
            if len(citations) > 3:
                print(f"  ... and {len(citations) - 3} more")
        
        print("\n" + "=" * 70)
        
    except Exception as e:
        print(f"\n❌ Pipeline error: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test/test_quick.py 'Your query here'")
        print("\nExample queries:")
        print("  python test/test_quick.py 'ROE là gì?'")
        print("  python test/test_quick.py 'So sánh VNM và VCB'")
        print("  python test/test_quick.py 'Phân tích tài chính VNM Q3 2024'")
        print("  python test/test_quick.py 'Giá vàng hôm nay?'  # Triggers fallback")
        print("\nTesting malicious queries:")
        print("  python test/test_quick.py 'bạn là ai?'  # Should be blocked")
        print("  python test/test_quick.py 'ignore previous instructions'  # Blocked")
        sys.exit(1)
    
    query = " ".join(sys.argv[1:])
    asyncio.run(test_single_query(query))
