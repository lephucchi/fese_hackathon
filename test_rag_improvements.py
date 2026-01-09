"""
RAG Core Improvements Test Script

Tests:
1. Simple queries (3) - test conversational prompts
2. Fallback query (1) - test news-first fallback
3. Complex queries (3) - test decomposition + fallback
4. All 6 in same session - test Redis cache

Run: python test_rag_improvements.py
"""
import asyncio
import os
import sys
import time
import logging

# Setup path
sys.path.insert(0, os.getcwd())

# Setup logging - show INFO level
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Reduce noise from other loggers
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("sentence_transformers").setLevel(logging.WARNING)

from dotenv import load_dotenv
load_dotenv()


async def test_rag_pipeline():
    """Test RAG pipeline with 6 queries."""
    
    print("\n" + "=" * 80)
    print("🧪 RAG CORE IMPROVEMENTS TEST")
    print("=" * 80)
    
    # Import pipeline
    from src.pipeline import run_rag_pipeline_async
    
    # Test queries
    queries = [
        # === SIMPLE QUERIES (3) ===
        {
            "query": "ROE là gì?",
            "type": "SIMPLE",
            "expect": "Conversational answer, no headers"
        },
        {
            "query": "VNM là công ty nào?",
            "type": "SIMPLE",
            "expect": "Company info from glossary/finance"
        },
        {
            "query": "PE ratio dùng để làm gì?",
            "type": "SIMPLE",
            "expect": "Definition with friendly tone"
        },
        
        # === FALLBACK QUERY (1) ===
        {
            "query": "Tin tức VCB hôm nay thế nào?",
            "type": "FALLBACK",
            "expect": "Should trigger temporal fallback"
        },
        
        # === COMPLEX QUERIES (3) - Decomposition + Fallback ===
        {
            "query": "So sánh ROE và ROA, cho ví dụ với VNM và HPG",
            "type": "COMPLEX",
            "expect": "Decomposed into sub-queries, may need fallback for stock data"
        },
        {
            "query": "Phân tích xu hướng thị trường tuần này và dự báo tuần tới cho ngành ngân hàng",
            "type": "COMPLEX",
            "expect": "Decomposed, temporal fallback likely"
        },
    ]
    
    results = []
    
    for i, q in enumerate(queries, 1):
        print(f"\n{'='*80}")
        print(f"📝 QUERY {i}/{len(queries)}: [{q['type']}]")
        print(f"   Query: {q['query']}")
        print(f"   Expect: {q['expect']}")
        print("=" * 80)
        
        start = time.time()
        
        try:
            result = await run_rag_pipeline_async(q["query"])
            elapsed = time.time() - start
            
            # Extract key info
            answer = result.get("answer", "")[:500]
            is_complex = result.get("is_complex", False)
            sub_queries = result.get("sub_queries", [])
            fallback_used = result.get("fallback_used", False)
            routes = result.get("routes", [])
            total_time = result.get("total_time_ms", elapsed * 1000)
            
            print(f"\n✅ RESULT:")
            print(f"   ⏱️  Time: {total_time:.0f}ms")
            print(f"   🔀 Routes: {routes}")
            print(f"   📊 Complex: {is_complex} | Sub-queries: {len(sub_queries)}")
            print(f"   🔄 Fallback: {fallback_used}")
            print(f"\n   📖 Answer Preview:")
            print(f"   {'-'*60}")
            # Print answer with word wrap
            for line in answer.split('\n')[:10]:
                print(f"   {line[:75]}")
            if len(answer) > 500:
                print(f"   ... (truncated)")
            print(f"   {'-'*60}")
            
            results.append({
                "query": q["query"],
                "type": q["type"],
                "success": True,
                "time_ms": total_time,
                "fallback": fallback_used,
                "complex": is_complex,
                "sub_queries": len(sub_queries)
            })
            
        except Exception as e:
            elapsed = time.time() - start
            print(f"\n❌ ERROR: {e}")
            results.append({
                "query": q["query"],
                "type": q["type"],
                "success": False,
                "error": str(e),
                "time_ms": elapsed * 1000
            })
        
        # Small delay between queries
        await asyncio.sleep(0.5)
    
    # Summary
    print("\n" + "=" * 80)
    print("📊 TEST SUMMARY")
    print("=" * 80)
    
    success_count = sum(1 for r in results if r.get("success"))
    fallback_count = sum(1 for r in results if r.get("fallback"))
    complex_count = sum(1 for r in results if r.get("complex"))
    avg_time = sum(r.get("time_ms", 0) for r in results) / len(results)
    
    print(f"   ✅ Success: {success_count}/{len(results)}")
    print(f"   🔄 Fallback triggered: {fallback_count}")
    print(f"   📊 Complex (decomposed): {complex_count}")
    print(f"   ⏱️  Average time: {avg_time:.0f}ms")
    
    print("\n📋 Per-Query Results:")
    for i, r in enumerate(results, 1):
        status = "✅" if r.get("success") else "❌"
        fallback = "🔄" if r.get("fallback") else "  "
        complex_flag = "📊" if r.get("complex") else "  "
        print(f"   {i}. {status} {fallback} {complex_flag} [{r['type']:8}] {r['query'][:40]}... ({r.get('time_ms', 0):.0f}ms)")
    
    return results


async def test_redis_cache():
    """Test Redis cache for chat history."""
    print("\n" + "=" * 80)
    print("🔴 REDIS CACHE TEST")
    print("=" * 80)
    
    from src.api.services.cache_service import get_cache_service
    
    cache = get_cache_service()
    test_user = "test-user-rag-improvements"
    
    print(f"   Redis connected: {cache.is_connected}")
    
    if not cache.is_connected:
        print("   ⚠️ Redis not connected - skipping cache test")
        return
    
    # Test chat history
    print("\n   Testing chat history...")
    await cache.add_chat_message(test_user, "user", "Test question 1")
    await cache.add_chat_message(test_user, "assistant", "Test answer 1")
    await cache.add_chat_message(test_user, "user", "Test question 2")
    
    history = await cache.get_chat_history(test_user, limit=5)
    print(f"   ✅ Chat history saved: {len(history)} messages")
    for msg in history:
        print(f"      - {msg.get('role')}: {msg.get('content')[:50]}")
    
    # Test retrieved IDs
    print("\n   Testing retrieved IDs...")
    await cache.add_retrieved_ids(test_user, ["doc-1", "doc-2", "doc-3"])
    ids = await cache.get_retrieved_ids(test_user)
    print(f"   ✅ Retrieved IDs: {ids}")
    
    # Cleanup
    await cache.clear_context(test_user)
    await cache.clear_retrieved_ids(test_user)
    print("   ✅ Cleanup complete")


if __name__ == "__main__":
    print("\n🚀 Starting RAG Improvements Test Suite...")
    print("   Make sure the API server or models are warmed up!\n")
    
    # Run tests
    asyncio.run(test_redis_cache())
    asyncio.run(test_rag_pipeline())
    
    print("\n✅ All tests completed!")
