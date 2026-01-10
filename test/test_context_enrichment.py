"""
Test Context Enrichment Features

Tests:
1. Swiped-right news context (user_interactions)
2. Portfolio ticker-mapped news context

Creates mock data for testing.
"""
import httpx
import asyncio
import os
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

load_dotenv()

console = Console()
BASE_URL = "http://localhost:8000"

# Test credentials
TEST_EMAIL = "chi@gmail.com"
TEST_PASSWORD = "Chi3366@"

# Mock portfolio tickers for testing
MOCK_PORTFOLIO_TICKERS = ["FPT", "VNM", "VCB"]


async def login() -> tuple[str, dict]:
    """Login and get access token + cookies."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            cookies = dict(response.cookies)
            data = response.json()
            user_id = data.get("user", {}).get("user_id", "")
            console.print(f"✅ Login successful, user_id: {user_id}")
            return user_id, cookies
        else:
            console.print(f"❌ Login failed: {response.text}")
            return "", {}


async def test_swiped_news_context(cookies: dict):
    """Test getting swiped-right news as context."""
    console.print("\n" + "="*80)
    console.print("[TEST 1] Swiped-Right News Context", style="bold blue")
    console.print("="*80)
    
    async with httpx.AsyncClient(cookies=cookies) as client:
        # Get user's swiped news via my-interests endpoint
        response = await client.get(
            f"{BASE_URL}/api/interactions/my-interests"
        )
        
        if response.status_code == 200:
            data = response.json()
            approved_news = data.get("news", [])
            approved_count = data.get("total", len(approved_news))
            
            console.print(f"📋 Approved (swiped-right) news count: {approved_count}")
            if approved_news:
                for news in approved_news[:3]:
                    console.print(f"   - {news.get('title', '')[:50]}...")
            else:
                console.print("   [yellow]No swiped news found - will create mock swipes[/yellow]")
                return False
            return approved_count > 0
        else:
            console.print(f"❌ Failed to get approved news: {response.status_code}")
            return False


async def test_portfolio_ticker_news(cookies: dict):
    """Test getting portfolio ticker-mapped news."""
    console.print("\n" + "="*80)
    console.print("[TEST 2] Portfolio Ticker News Context", style="bold blue")  
    console.print("="*80)
    
    async with httpx.AsyncClient(cookies=cookies, timeout=30) as client:
        # Get user portfolio
        portfolio_response = await client.get(f"{BASE_URL}/api/portfolio")
        
        if portfolio_response.status_code == 200:
            portfolio = portfolio_response.json()
            has_portfolio = portfolio.get("has_portfolio", False)
            
            if has_portfolio:
                items = portfolio.get("items", [])
                tickers = [item.get("ticker") for item in items]
                console.print(f"📊 Portfolio tickers: {tickers}")
                
                # For each ticker, check if we have news
                for ticker in tickers[:3]:  # Test first 3
                    news_response = await client.get(
                        f"{BASE_URL}/api/news/ticker/{ticker}",
                        params={"limit": 3}
                    )
                    if news_response.status_code == 200:
                        news_data = news_response.json()
                        news_count = len(news_data.get("items", []))
                        console.print(f"   📰 {ticker}: {news_count} news articles")
                    else:
                        console.print(f"   ⚠️ {ticker}: Could not fetch news")
                return True
            else:
                console.print("   [yellow]No portfolio found - will create mock portfolio[/yellow]")
                return False
        else:
            console.print(f"❌ Failed to get portfolio: {portfolio_response.status_code}")
            return False


async def create_mock_portfolio(cookies: dict):
    """Create mock portfolio positions for testing."""
    console.print("\n" + "="*80)
    console.print("[SETUP] Creating Mock Portfolio", style="bold green")
    console.print("="*80)
    
    async with httpx.AsyncClient(cookies=cookies) as client:
        for ticker in MOCK_PORTFOLIO_TICKERS:
            try:
                response = await client.post(
                    f"{BASE_URL}/api/portfolio",
                    json={
                        "ticker": ticker,
                        "volume": 100,
                        "avg_buy_price": 50000.0
                    }
                )
                if response.status_code in [200, 201]:
                    console.print(f"   ✅ Added {ticker} to portfolio")
                elif response.status_code == 409:
                    console.print(f"   ℹ️ {ticker} already in portfolio")
                else:
                    console.print(f"   ⚠️ Failed to add {ticker}: {response.status_code}")
            except Exception as e:
                console.print(f"   ❌ Error adding {ticker}: {e}")


async def create_mock_swipe_interactions(cookies: dict, user_id: str):
    """Create mock swipe-right interactions for testing."""
    console.print("\n" + "="*80)
    console.print("[SETUP] Creating Mock Swipe Interactions", style="bold green")
    console.print("="*80)
    
    async with httpx.AsyncClient(cookies=cookies, timeout=30) as client:
        # First get some news to swipe
        news_response = await client.get(
            f"{BASE_URL}/api/news",
            params={"limit": 5}
        )
        
        if news_response.status_code == 200:
            news_items = news_response.json().get("items", [])
            
            for news in news_items[:5]:
                news_id = news.get("news_id")
                if news_id:
                    try:
                        swipe_response = await client.post(
                            f"{BASE_URL}/api/interactions",
                            json={
                                "news_id": news_id,
                                "action_type": "SWIPE_RIGHT"
                            }
                        )
                        if swipe_response.status_code in [200, 201]:
                            console.print(f"   ✅ Swiped right on: {news.get('title', '')[:50]}...")
                        elif swipe_response.status_code == 409:
                            console.print(f"   ℹ️ Already swiped: {news.get('title', '')[:30]}...")
                        else:
                            console.print(f"   ⚠️ Swipe failed: {swipe_response.status_code}")
                    except Exception as e:
                        console.print(f"   ❌ Error: {e}")
        else:
            console.print(f"   ❌ Could not fetch news: {news_response.status_code}")


async def test_chat_with_context(cookies: dict):
    """Test chat endpoint to verify context is being used."""
    console.print("\n" + "="*80)
    console.print("[TEST 3] Chat with Context Enrichment", style="bold blue")
    console.print("="*80)
    
    async with httpx.AsyncClient(cookies=cookies, timeout=120) as client:
        query = "Phân tích cổ phiếu FPT dựa trên tin tức gần đây"
        console.print(f"📝 Query: {query}")
        
        response = await client.post(
            f"{BASE_URL}/api/market/chat",
            json={"query": query}
        )
        
        if response.status_code == 200:
            data = response.json()
            tier = data.get("tier", "N/A")
            elapsed = data.get("elapsed_ms", 0)
            context_used = data.get("context_used", 0)
            cached = data.get("cached", False)
            answer = data.get("answer", "")[:300]
            
            console.print(f"\n[RESULT]")
            console.print(f"   Tier: {tier}")
            console.print(f"   Time: {elapsed/1000:.2f}s")
            console.print(f"   Context Used: {context_used}")
            console.print(f"   Cached: {cached}")
            console.print(f"   Answer Preview: {answer}...")
            
            return True
        else:
            console.print(f"❌ Chat failed: {response.status_code}")
            return False


async def check_redis_cache(cookies: dict):
    """Check Redis cache for context data."""
    console.print("\n" + "="*80)
    console.print("[TEST 4] Redis Cache Verification", style="bold blue")
    console.print("="*80)
    
    import redis
    
    try:
        r = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379"))
        
        # Get all chat-related keys
        keys = list(r.scan_iter("chat:*"))
        
        table = Table(title="Redis Cache Contents")
        table.add_column("Key", style="cyan")
        table.add_column("Type", style="green")
        table.add_column("Size/Count")
        
        for key in keys:
            key_str = key.decode() if isinstance(key, bytes) else key
            key_type = r.type(key).decode()
            
            if key_type == "string":
                import json
                data = json.loads(r.get(key))
                if isinstance(data, dict):
                    size = len(data)
                    # Check for enriched context
                    if "ticker_news" in data:
                        tickers = list(data.get("ticker_news", {}).keys())
                        table.add_row(key_str, "rag_cache", f"ticker_news: {tickers}")
                    elif "entities" in data:
                        entities = data.get("entities", [])
                        facts = len(data.get("facts", []))
                        table.add_row(key_str, "rag_cache", f"{len(entities)} entities, {facts} facts")
                    else:
                        table.add_row(key_str, key_type, f"{size} items")
                else:
                    table.add_row(key_str, key_type, str(len(data)))
            elif key_type == "list":
                table.add_row(key_str, key_type, str(r.llen(key)))
            elif key_type == "hash":
                table.add_row(key_str, key_type, str(r.hlen(key)))
        
        console.print(table)
        
        if keys:
            console.print("✅ Redis cache operational with context data")
        else:
            console.print("⚠️ No cache keys found")
            
    except Exception as e:
        console.print(f"❌ Redis error: {e}")


async def main():
    console.print("="*80)
    console.print("CONTEXT ENRICHMENT FEATURE TEST", style="bold white on blue")
    console.print("="*80)
    console.print("\nTests:")
    console.print("  1. Swiped-right news as context")
    console.print("  2. Portfolio ticker-mapped news") 
    console.print("  3. Chat with enriched context")
    console.print("  4. Redis cache verification\n")
    
    # Login
    user_id, cookies = await login()
    if not cookies:
        console.print("❌ Cannot continue without authentication")
        return
    
    # Test 1: Swiped news
    has_swipes = await test_swiped_news_context(cookies)
    
    # Test 2: Portfolio ticker news  
    has_portfolio = await test_portfolio_ticker_news(cookies)
    
    # Create mock data if needed
    if not has_portfolio:
        await create_mock_portfolio(cookies)
        await test_portfolio_ticker_news(cookies)
        
    if not has_swipes:
        await create_mock_swipe_interactions(cookies, user_id)
        await test_swiped_news_context(cookies)
    
    # Test 3: Chat with context
    await test_chat_with_context(cookies)
    
    # Test 4: Redis cache
    await check_redis_cache(cookies)
    
    console.print("\n" + "="*80)
    console.print("[COMPLETE] All context enrichment tests finished", style="bold green")
    console.print("="*80)


if __name__ == "__main__":
    asyncio.run(main())
