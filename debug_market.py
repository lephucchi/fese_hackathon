
import asyncio
import os
import json
import logging
from dotenv import load_dotenv
from supabase import create_client, Client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_market_features():
    load_dotenv()
    
    # Initialize Supabase
    # Try standard backend names first
    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_KEY")
    
    # Fallback to frontend names or other variants
    if not key:
        key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        key = os.getenv("SUPABASE_ANON_KEY")
    if not key:
        key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
    if not url or not key:
        logger.error(f"Missing Supabase credentials. Found URL: {bool(url)}, Key: {bool(key)}")
        return
    
    supabase: Client = create_client(url, key)
    
    logger.info("--- Testing Market Features ---")
    
    # 1. Test Chat History Table Existence
    logger.info("\n1. Verifying chat_history table...")
    try:
        # Try to select 1 record
        response = supabase.table("chat_history").select("count", count="exact").limit(1).execute()
        logger.info(f"✓ chat_history table exists. Total records: {response.count}")
    except Exception as e:
        logger.error(f"❌ chat_history table missing or inaccessible: {e}")
        logger.info("Please run the SQL schema to create the table.")
        # Don't return, verify other things

    # 2. Test News Stack
    logger.info("\n2. Testing News Stack...")
    try:
        # Get a user (or use dummy)
        user_id = "test-user-debug"
        
        # Get count
        try:
            interactions = supabase.table("user_interactions").select("news_id", count="exact").eq("user_id", user_id).execute()
            interacted = interactions.count or 0
            logger.info(f"User {user_id} has {interacted} interactions")
        except Exception as e:
            logger.warning(f"user_interactions table check failed: {e}")

        # Fetch stack
        news = supabase.table("news").select("title, sentiment, analyst").limit(5).execute()
        if news.data:
            logger.info(f"✓ Stack query working. Found {len(news.data)} news.")
            logger.info(f"Sample: {news.data[0]['title']}")
        else:
            logger.warning("No news found in DB.")
            
    except Exception as e:
        logger.error(f"❌ Stack test failed: {e}")

    # 3. Test Analytics Aggregation
    logger.info("\n3. Testing Analytics Data...")
    try:
        # Just check if we can aggregate
        news = supabase.table("news").select("sentiment").limit(50).execute()
        if news.data:
            sentiments = [n.get("sentiment") for n in news.data]
            logger.info(f"✓ Fetched {len(sentiments)} sentiments for analytics.")
    except Exception as e:
        logger.error(f"❌ Analytics test failed: {e}")

    # 4. Test Redis Cache
    logger.info("\n4. Testing Redis Cache...")
    try:
        from src.api.services.cache_service import get_cache_service
        cache = get_cache_service()
        if cache.is_connected:
            logger.info("✓ Redis connected successfully")
            await cache.set_context("test-user-debug", {"test": "data"})
            data = await cache.get_context("test-user-debug")
            logger.info(f"✓ Cache Set/Get verified: {data}")
        else:
            logger.warning("⚠️ Redis not connected (Cache disabled - graceful degradation active)")
            logger.info("Ensure Redis server is running at REDIS_URL")
    except Exception as e:
        logger.error(f"❌ Cache test failed: {e}")

    # 5. Test Chat Context Logic
    logger.info("\n5. Testing Chat Context Simulation...")
    try:
        from src.api.dependencies import get_supabase_client
        from src.api.repositories.market_repository import MarketRepository
        from src.api.repositories.chat_repository import ChatRepository
        from src.api.repositories.user_interaction_repository import UserInteractionRepository
        from src.api.repositories.news_repository import NewsRepository
        from src.api.services.market_service import MarketService
        
        # Get a real user ID for FK constraint
        try:
            # Try 'users' table or 'auth.users' specific logic usually requires admin
            # Here assumes public 'users' table as per user prompt
            u_response = supabase.table("users").select("user_id").limit(1).execute()
            if u_response.data:
                valid_user_id = u_response.data[0]["user_id"]
                logger.info(f"Using existing user_id: {valid_user_id}")
            else:
                import uuid
                valid_user_id = str(uuid.uuid4())
                logger.warning(f"No users found. Using random UUID {valid_user_id} (might fail FK)")
        except Exception as e:
            import uuid
            valid_user_id = str(uuid.uuid4())
            logger.warning(f"Could not fetch user: {e}. Using random UUID {valid_user_id}")

        # Simulate chat
        result = await market_service.chat_with_context(
            user_id=valid_user_id,
            query="Test query about market",
            use_interests=True
        )
        logger.info(f"✓ Chat processed. Answer length: {len(result.get('answer', ''))}")
        logger.info(f"✓ Message ID: {result.get('message_id')}")
        
    except Exception as e:
        logger.error(f"❌ Chat logic test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_market_features())
