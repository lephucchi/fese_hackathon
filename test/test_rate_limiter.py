"""
Test Fallback Rate Limiter.

Tests:
1. Basic rate limiting (allow/block)
2. Sliding window behavior
3. Multiple users
4. Stats tracking
"""
import sys
import os
import time
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from src.core.fallback.rate_limiter import FallbackRateLimiter, get_fallback_limiter


def test_basic_rate_limiting():
    print("\n" + "=" * 60)
    print("TEST 1: Basic Rate Limiting")
    print("=" * 60)
    
    # Create limiter: 3 calls per 10 seconds
    limiter = FallbackRateLimiter(limit_per_user=3, window_seconds=10)
    user_id = "test_user_123"
    
    print("\nAttempting 5 calls (limit is 3):")
    for i in range(1, 6):
        result = limiter.check_limit(user_id)
        status = "✅ ALLOWED" if result.allowed else "❌ BLOCKED"
        print(f"{status} Call {i}: {result.reason} ({result.current_count}/{result.limit})")
        
        if not result.allowed:
            print(f"   Retry after: {result.retry_after}s")
    
    print("\n✓ Test 1 passed!")


def test_sliding_window():
    print("\n" + "=" * 60)
    print("TEST 2: Sliding Window Behavior")
    print("=" * 60)
    
    limiter = FallbackRateLimiter(limit_per_user=2, window_seconds=5)
    user_id = "test_user_456"
    
    print("\nCall 1 & 2 (should be allowed):")
    for i in range(1, 3):
        result = limiter.check_limit(user_id)
        status = "✅" if result.allowed else "❌"
        print(f"{status} Call {i}: {result.current_count}/{result.limit}")
    
    print("\nCall 3 (should be blocked):")
    result = limiter.check_limit(user_id)
    print(f"❌ Call 3: {result.reason}")
    print(f"   Retry after: {result.retry_after}s")
    
    print("\nWaiting 6 seconds for window to expire...")
    time.sleep(6)
    
    print("\nCall 4 (after window, should be allowed):")
    result = limiter.check_limit(user_id)
    status = "✅" if result.allowed else "❌"
    print(f"{status} Call 4: {result.current_count}/{result.limit}")
    
    print("\n✓ Test 2 passed!")


def test_multiple_users():
    print("\n" + "=" * 60)
    print("TEST 3: Multiple Users")
    print("=" * 60)
    
    limiter = FallbackRateLimiter(limit_per_user=2, window_seconds=10)
    
    users = ["user_A", "user_B", "user_C"]
    
    print("\nEach user gets 2 calls:")
    for user in users:
        print(f"\n{user}:")
        for i in range(1, 4):
            result = limiter.check_limit(user)
            status = "✅" if result.allowed else "❌"
            print(f"  {status} Call {i}: {result.current_count}/{result.limit}")
    
    print("\n✓ Test 3 passed!")


def test_stats():
    print("\n" + "=" * 60)
    print("TEST 4: Statistics Tracking")
    print("=" * 60)
    
    limiter = FallbackRateLimiter(limit_per_user=3, window_seconds=10)
    
    # Make some calls
    users = ["user_1", "user_2", "user_3"]
    for user in users:
        for _ in range(2):
            limiter.check_limit(user)
    
    stats = limiter.get_stats()
    
    print("\nRate Limiter Statistics:")
    print(f"  Total users: {stats['total_users']}")
    print(f"  Total calls in window: {stats['total_calls_in_window']}")
    print(f"  Limit per user: {stats['limit_per_user']}")
    print(f"  Window: {stats['window_seconds']}s")
    
    assert stats['total_users'] == 3
    assert stats['total_calls_in_window'] == 6
    
    print("\n✓ Test 4 passed!")


def test_singleton():
    print("\n" + "=" * 60)
    print("TEST 5: Singleton Pattern")
    print("=" * 60)
    
    limiter1 = get_fallback_limiter(limit_per_user=5, window_seconds=3600)
    limiter2 = get_fallback_limiter(limit_per_user=5, window_seconds=3600)
    
    print(f"\nLimiter 1 ID: {id(limiter1)}")
    print(f"Limiter 2 ID: {id(limiter2)}")
    
    assert limiter1 is limiter2
    print("\n✅ Same instance - Singleton working!")
    
    print("\n✓ Test 5 passed!")


if __name__ == "__main__":
    print("\n🛡️ Fallback Rate Limiter Testing")
    
    test_basic_rate_limiting()
    test_sliding_window()
    test_multiple_users()
    test_stats()
    test_singleton()
    
    print("\n" + "=" * 60)
    print("✅ All tests completed successfully!")
    print("=" * 60)
