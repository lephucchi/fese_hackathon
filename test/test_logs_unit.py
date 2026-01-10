
import asyncio
import unittest
from unittest.mock import MagicMock, AsyncMock
import sys
import os

sys.path.append(os.getcwd())
from src.api.services.market_service import MarketService

class TestMarketServiceLogs(unittest.TestCase):
    def setUp(self):
        self.market_repo = MagicMock()
        self.chat_repo = AsyncMock()
        self.interaction_repo = AsyncMock()
        self.news_repo = AsyncMock()
        self.cache_mock = AsyncMock()
        
        self.service = MarketService(
            self.market_repo, 
            self.chat_repo, 
            self.interaction_repo, 
            self.news_repo
        )
        self.service.cache = self.cache_mock

    def test_logs_propagation_mock(self):
        async def run_test():
            # Mock _process method to return logs
            mock_logs = [{"step": "mock", "detail": "test log"}]
            self.service._process_with_context_and_cache = AsyncMock(
                return_value=("Mock Answer", {}, mock_logs)
            )
            
            # Mock dependencies to force Tier 3
            self.cache_mock.get_chat_history.return_value = []
            self.cache_mock.get_rag_cache.return_value = {} 
            self.cache_mock.get_context.return_value = {}
            self.interaction_repo.find_approved_news_ids.return_value = []
            
            response = await self.service.chat_with_context("user1", "query")
            
            self.assertIn("logs", response)
            self.assertEqual(response["logs"], mock_logs)
            print("✅ Verified: MarketService propagates logs correctly")

        asyncio.run(run_test())

if __name__ == "__main__":
    unittest.main()
