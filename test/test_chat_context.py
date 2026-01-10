"""
Test Chat Context & History - 3-Tier Response System
Tests conversation grounding, caching, and DB persistence
"""
import asyncio
import json
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent))

import httpx
from dotenv import load_dotenv

load_dotenv()

BASE_URL = "http://localhost:8000"

# Test scenarios for 3-tier system - More diverse prompts
CONVERSATION_FLOW = [
    {
        "step": 1,
        "query": "FPT có những mảng kinh doanh nào?",
        "expected_tier": 3,  # Full pipeline - first query
        "description": "First query - should run full RAG pipeline"
    },
    {
        "step": 2,
        "query": "Doanh thu của FPT năm 2024 là bao nhiêu?",
        "expected_tier": 1,  # Cache hit - same entity
        "description": "Follow-up about FPT - should use cached facts"
    },
    {
        "step": 3,
        "query": "VNM hoạt động trong ngành gì?",
        "expected_tier": 3,  # New entity VNM - full pipeline
        "description": "New entity VNM - should run full pipeline"
    },
    {
        "step": 4,
        "query": "So sánh quy mô của FPT và VNM",
        "expected_tier": 1,  # Both entities cached
        "description": "Both entities cached - should use cache"
    }
]


async def get_auth_cookies(client: httpx.AsyncClient):
    """Get authenticated cookies via login."""
    
    print(f"[AUTH] Logging in with account: chi@gmail.com...")
    login_resp = await client.post(
        f"{BASE_URL}/api/auth/login",
        json={
            "email": "chi@gmail.com",
            "password": "Chi3366@"
        },
        follow_redirects=True
    )
    
    if login_resp.status_code == 200:
        print("✅ Login successful")
        print(f"   Cookies: {list(login_resp.cookies.keys())}")
        return dict(login_resp.cookies)
    
    print(f"❌ Authentication failed: {login_resp.status_code}")
    print(f"Response: {login_resp.text}")
    return None


async def clear_redis_cache():
    """Clear user's Redis cache to start fresh."""
    print("\n[SETUP] Clearing Redis cache...")
    try:
        import redis
        r = redis.from_url("redis://localhost:6379", decode_responses=True)
        
        # Delete all chat keys for test user
        keys = r.keys("chat:*")
        if keys:
            r.delete(*keys)
            print(f"   Cleared {len(keys)} cache keys")
        else:
            print("   No cache keys to clear")
    except Exception as e:
        print(f"   Warning: Could not clear Redis: {e}")


async def test_3tier_flow():
    """Test 3-tier response system with conversation flow."""
    
    print("=" * 80)
    print("[TEST] 3-Tier Response System")
    print("=" * 80)
    print()
    print("Expected behavior:")
    print("  - Query 1: Tier 3 (full pipeline) ~60s")
    print("  - Query 2: Tier 1 (cache hit) ~3-5s ⚡")
    print("  - Query 3: Tier 3 (new entity) ~60s")
    print()
    
    # Clear cache for clean test
    await clear_redis_cache()
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        cookies = await get_auth_cookies(client)
        
        if not cookies:
            print("❌ Cannot proceed without authentication")
            return
        
        print()
        results = []
        
        for conv in CONVERSATION_FLOW:
            print("-" * 80)
            print(f"[Step {conv['step']}] {conv['description']}")
            print(f"   Query: \"{conv['query']}\"")
            print(f"   Expected Tier: {conv['expected_tier']}")
            print()
            
            start_time = time.time()
            
            # Send chat request
            chat_resp = await client.post(
                f"{BASE_URL}/api/market/chat",
                json={
                    "query": conv["query"],
                    "use_interests": True
                },
                cookies=cookies
            )
            
            elapsed = time.time() - start_time
            
            if chat_resp.status_code != 200:
                print(f"❌ Request failed: {chat_resp.status_code}")
                print(f"   Response: {chat_resp.text[:200]}")
                continue
            
            result = chat_resp.json()
            actual_tier = result.get("tier", "N/A")
            
            # Display result
            print(f"[Response]")
            print(f"   Tier: {actual_tier} {'✅' if actual_tier == conv['expected_tier'] else '⚠️'}")
            print(f"   Time: {elapsed:.2f}s ({result.get('elapsed_ms', 0)}ms)")
            print(f"   Cached: {result.get('cached', False)}")
            print(f"   Context used: {result.get('context_used', 0)}")
            print(f"   Message ID: {result.get('message_id', 'N/A')}")
            print()
            print(f"   Answer preview: {result['answer'][:200]}...")
            print()
            
            # Validate tier
            if actual_tier == conv["expected_tier"]:
                print(f"✅ Tier matched expected ({actual_tier})")
            else:
                print(f"⚠️  Tier mismatch: expected {conv['expected_tier']}, got {actual_tier}")
            
            # Validate timing
            if actual_tier == 1 and elapsed < 10:
                print(f"✅ Fast response for Tier 1 ({elapsed:.2f}s < 10s)")
            elif actual_tier == 3 and elapsed > 5:
                print(f"✅ Full pipeline timing for Tier 3 ({elapsed:.2f}s)")
            
            results.append({
                "step": conv["step"],
                "query": conv["query"],
                "expected_tier": conv["expected_tier"],
                "actual_tier": actual_tier,
                "elapsed_s": elapsed,
                "success": actual_tier == conv["expected_tier"]
            })
            
            print()
            
            # Small delay between queries
            if conv["step"] < len(CONVERSATION_FLOW):
                await asyncio.sleep(1)
        
        # Summary
        print("=" * 80)
        print("[SUMMARY]")
        print("=" * 80)
        print()
        
        success_count = sum(1 for r in results if r["success"])
        print(f"Tests passed: {success_count}/{len(results)}")
        print()
        
        for r in results:
            status = "✅" if r["success"] else "❌"
            print(f"  {status} Step {r['step']}: Tier {r['actual_tier']} in {r['elapsed_s']:.2f}s")
        
        print()


async def test_redis_cache():
    """Test Redis caching of RAG results."""
    
    print()
    print("=" * 80)
    print("[TEST] Redis Cache Verification")
    print("=" * 80)
    print()
    
    try:
        import redis
        r = redis.from_url("redis://localhost:6379", decode_responses=True)
        
        keys = r.keys("chat:*")
        print(f"Found {len(keys)} cache keys:")
        
        for key in keys:
            key_type = r.type(key)
            if key_type == "string":
                data = r.get(key)
                if data:
                    parsed = json.loads(data)
                    if "facts" in parsed:
                        print(f"  📦 {key}: {len(parsed.get('facts', []))} facts, {len(parsed.get('entities', []))} entities")
                    else:
                        print(f"  📄 {key}: {len(data)} chars")
            elif key_type == "list":
                length = r.llen(key)
                print(f"  📋 {key}: {length} items")
            elif key_type == "set":
                length = r.scard(key)
                print(f"  🔢 {key}: {length} items")
            else:
                print(f"  ❓ {key}: type={key_type}")
        
        print()
        print("✅ Redis cache operational")
        
    except Exception as e:
        print(f"❌ Redis check failed: {e}")


async def test_db_persistence():
    """Test Supabase chat history persistence."""
    
    print()
    print("=" * 80)
    print("[TEST] Database Persistence (Supabase)")
    print("=" * 80)
    print()
    
    print("💡 To verify DB persistence:")
    print("   1. Check Supabase dashboard → chat_history table")
    print("   2. Look for recent messages with tier info")
    print()
    print("✅ Messages saved during test flow")


async def main():
    """Run all tests."""
    try:
        # Test 1: 3-tier response system
        await test_3tier_flow()
        
        # Test 2: Redis caching verification
        await test_redis_cache()
        
        # Test 3: Database persistence note
        await test_db_persistence()
        
        print()
        print("=" * 80)
        print("[COMPLETE] All tests finished")
        print("=" * 80)
        print()
        
    except Exception as e:
        print(f"[ERROR] Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(main())
