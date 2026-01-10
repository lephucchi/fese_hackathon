
import asyncio
import logging
import json
import os
import sys

# Add project root to path
sys.path.append(os.getcwd())

from src.api.services.market_service import MarketService
from src.api.repositories.market_repository import MarketRepository
from src.api.repositories.chat_repository import ChatRepository
from src.api.repositories.user_interaction_repository import UserInteractionRepository
from src.api.repositories.news_repository import NewsRepository

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_logs():
    """Test if logs are returned in chat response."""
    
    # Mock repositories
    market_repo = MarketRepository(None)
    chat_repo = ChatRepository(None)
    interaction_repo = UserInteractionRepository(None)
    news_repo = NewsRepository(None)
    
    # Initialize service
    service = MarketService(market_repo, chat_repo, interaction_repo, news_repo)
    
    # Mock cache methods (since we don't have real Redis in this test script easily without mocking)
    # But wait, run-backend-local is running Redis. We can use real service if we instantiate it properly.
    # However, mocking is faster/safer for unit verification.
    # Let's try to run a real query if possible, or just mock the pipeline call.
    
    # Actually, simpler: Use `httpx` to call the running backend!
    import httpx
    
    async with httpx.AsyncClient() as client:
        # Login first (or use generic user ID if auth disabled)
        # Assuming auth is needed
        pass
        
    print("Please run this test against the running backend using curl or Postman, or use the existing test_context_enrichment.py")
    return

async def test_deployment_verification():
    """ Verify logs by calling the API directly """
    import httpx
    
    base_url = "http://localhost:8000"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        # 1. Login
        logger.info("Logging in...")
        login_res = await client.post(f"{base_url}/api/auth/login", json={"email": "chi@gmail.com", "password": "Chi3366@"})
        
        if login_res.status_code != 200:
            logger.error(f"Login failed: {login_res.text}")
            return
            
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Send Chat Query (Tier 3 to generate logs)
        query = "Phân tích triển vọng FPT năm 2025"
        logger.info(f"Sending query: {query}")
        
        chat_res = await client.post(
            f"{base_url}/api/market/chat",
            json={"query": query, "use_interests": True},
            headers=headers
        )
        
        if chat_res.status_code != 200:
            logger.error(f"Chat failed: {chat_res.text}")
            return
            
        data = chat_res.json()
        
        # 3. Verify Logs
        if "logs" in data:
            logger.info(f"✅ Logs found in response: {len(data['logs'])} items")
            for log in data['logs']:
                logger.info(f"   [{log.get('step')}] {log.get('detail')}")
        else:
            logger.error("❌ 'logs' field missing in response!")
            logger.error(f"Response keys: {data.keys()}")

if __name__ == "__main__":
    asyncio.run(test_deployment_verification())
