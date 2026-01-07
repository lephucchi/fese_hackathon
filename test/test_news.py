"""
Comprehensive News API Tests.

Tests for:
- Get news list (with pagination, filters)
- Get news by ID
- Get news by ticker
- Get news statistics
"""
import pytest
from typing import Dict, Any


class TestNewsHelper:
    """Helper class for news API operations in tests."""
    
    def __init__(self, client, base_url: str):
        self.client = client
        self.base_url = base_url
    
    def get_news_list(
        self,
        page: int = 1,
        page_size: int = 10,
        sentiment: str = None
    ) -> Dict[str, Any]:
        """Get paginated news list."""
        params = {"page": page, "page_size": page_size}
        if sentiment:
            params["sentiment"] = sentiment
        
        response = self.client.get(
            f"{self.base_url}/news",
            params=params
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def get_news_by_id(self, news_id: str) -> Dict[str, Any]:
        """Get single news by ID."""
        response = self.client.get(f"{self.base_url}/news/{news_id}")
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def get_news_by_ticker(
        self,
        ticker: str,
        page: int = 1,
        page_size: int = 10
    ) -> Dict[str, Any]:
        """Get news by stock ticker."""
        response = self.client.get(
            f"{self.base_url}/news/ticker/{ticker}",
            params={"page": page, "page_size": page_size}
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def get_news_stats(self) -> Dict[str, Any]:
        """Get news statistics."""
        response = self.client.get(f"{self.base_url}/news/stats")
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }


@pytest.fixture(scope="module")
def news_helper(client, base_url):
    """Create news helper instance."""
    return TestNewsHelper(client, base_url)


class TestNewsListEndpoint:
    """Test GET /api/news endpoint."""
    
    def test_get_news_list_default(self, news_helper):
        """Test getting news list with default parameters."""
        result = news_helper.get_news_list()
        
        assert result["status_code"] == 200
        assert "news" in result["data"]
        assert "total" in result["data"]
        assert "page" in result["data"]
        assert "page_size" in result["data"]
        assert "has_next" in result["data"]
        assert isinstance(result["data"]["news"], list)
    
    def test_get_news_list_pagination_page_1(self, news_helper):
        """Test pagination - page 1."""
        result = news_helper.get_news_list(page=1, page_size=5)
        
        assert result["status_code"] == 200
        assert result["data"]["page"] == 1
        assert result["data"]["page_size"] == 5
        assert len(result["data"]["news"]) <= 5
    
    def test_get_news_list_pagination_page_2(self, news_helper):
        """Test pagination - page 2."""
        result = news_helper.get_news_list(page=2, page_size=5)
        
        assert result["status_code"] == 200
        assert result["data"]["page"] == 2
    
    def test_get_news_list_filter_sentiment_positive(self, news_helper):
        """Test filtering by positive sentiment."""
        result = news_helper.get_news_list(sentiment="positive")
        
        assert result["status_code"] == 200
        # All returned news should have positive sentiment (if any)
        for news in result["data"]["news"]:
            if news.get("sentiment"):
                assert news["sentiment"] == "positive"
    
    def test_get_news_list_filter_sentiment_negative(self, news_helper):
        """Test filtering by negative sentiment."""
        result = news_helper.get_news_list(sentiment="negative")
        
        assert result["status_code"] == 200
    
    def test_get_news_list_filter_sentiment_neutral(self, news_helper):
        """Test filtering by neutral sentiment."""
        result = news_helper.get_news_list(sentiment="neutral")
        
        assert result["status_code"] == 200
    
    def test_get_news_list_max_page_size(self, news_helper):
        """Test max page size limit."""
        result = news_helper.get_news_list(page_size=100)
        
        assert result["status_code"] == 200
        assert len(result["data"]["news"]) <= 100
    
    def test_get_news_list_invalid_page_size(self, news_helper):
        """Test invalid page size (exceeds max)."""
        result = news_helper.get_news_list(page_size=101)
        
        # Should return 422 validation error
        assert result["status_code"] == 422
    
    def test_get_news_list_news_item_structure(self, news_helper):
        """Test that news items have correct structure."""
        result = news_helper.get_news_list(page_size=1)
        
        assert result["status_code"] == 200
        
        if len(result["data"]["news"]) > 0:
            news_item = result["data"]["news"][0]
            
            # Required fields
            assert "news_id" in news_item
            assert "title" in news_item
            
            # Optional fields should exist (can be null)
            assert "content" in news_item
            assert "source_url" in news_item
            assert "published_at" in news_item
            assert "sentiment" in news_item
            assert "analyst" in news_item
            assert "tickers" in news_item


class TestNewsDetailEndpoint:
    """Test GET /api/news/{news_id} endpoint."""
    
    def test_get_news_by_id_valid(self, news_helper):
        """Test getting news by valid ID."""
        # First get a news item from list
        list_result = news_helper.get_news_list(page_size=1)
        
        if len(list_result["data"]["news"]) > 0:
            news_id = list_result["data"]["news"][0]["news_id"]
            
            result = news_helper.get_news_by_id(news_id)
            
            assert result["status_code"] == 200
            assert "news" in result["data"]
            assert result["data"]["news"]["news_id"] == news_id
    
    def test_get_news_by_id_not_found(self, news_helper):
        """Test getting news with non-existent ID."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        result = news_helper.get_news_by_id(fake_id)
        
        assert result["status_code"] == 404
    
    def test_get_news_by_id_invalid_uuid(self, news_helper):
        """Test getting news with invalid UUID format."""
        result = news_helper.get_news_by_id("invalid-uuid")
        
        # Should return 404 or 500 depending on implementation
        assert result["status_code"] in [404, 500]


class TestNewsByTickerEndpoint:
    """Test GET /api/news/ticker/{ticker} endpoint."""
    
    def test_get_news_by_ticker(self, news_helper):
        """Test getting news by ticker symbol."""
        result = news_helper.get_news_by_ticker("VNM")
        
        assert result["status_code"] == 200
        assert "ticker" in result["data"]
        assert "news" in result["data"]
        assert "total" in result["data"]
        assert "sentiment_summary" in result["data"]
    
    def test_get_news_by_ticker_uppercase(self, news_helper):
        """Test that ticker is converted to uppercase."""
        result = news_helper.get_news_by_ticker("vnm")
        
        assert result["status_code"] == 200
        assert result["data"]["ticker"] == "VNM"
    
    def test_get_news_by_ticker_pagination(self, news_helper):
        """Test pagination for ticker news."""
        result = news_helper.get_news_by_ticker("VNM", page=1, page_size=5)
        
        assert result["status_code"] == 200
        assert len(result["data"]["news"]) <= 5
    
    def test_get_news_by_ticker_no_results(self, news_helper):
        """Test ticker with no news."""
        result = news_helper.get_news_by_ticker("NONEXISTENT")
        
        assert result["status_code"] == 200
        assert result["data"]["total"] == 0
        assert len(result["data"]["news"]) == 0


class TestNewsStatsEndpoint:
    """Test GET /api/news/stats endpoint."""
    
    def test_get_news_stats(self, news_helper):
        """Test getting news statistics."""
        result = news_helper.get_news_stats()
        
        assert result["status_code"] == 200
        assert "total_news" in result["data"]
        assert "sentiment_stats" in result["data"]
        assert "top_tickers" in result["data"]
    
    def test_get_news_stats_sentiment_structure(self, news_helper):
        """Test sentiment stats structure."""
        result = news_helper.get_news_stats()
        
        assert result["status_code"] == 200
        
        sentiment_stats = result["data"]["sentiment_stats"]
        assert "positive" in sentiment_stats
        assert "negative" in sentiment_stats
        assert "neutral" in sentiment_stats
        assert "total" in sentiment_stats
    
    def test_get_news_stats_top_tickers_structure(self, news_helper):
        """Test top tickers structure."""
        result = news_helper.get_news_stats()
        
        assert result["status_code"] == 200
        
        top_tickers = result["data"]["top_tickers"]
        assert isinstance(top_tickers, list)
        
        if len(top_tickers) > 0:
            ticker = top_tickers[0]
            assert "ticker" in ticker
            assert "count" in ticker
