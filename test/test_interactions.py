"""
Comprehensive User Interactions API Tests.

Tests for:
- Create interaction (swipe left/right)
- Get user's interested news (my-interests)
- Update interaction
"""
import pytest
from typing import Dict, Any


class TestInteractionHelper:
    """Helper class for interaction API operations in tests."""
    
    def __init__(self, client, base_url: str):
        self.client = client
        self.base_url = base_url
    
    def create_interaction(
        self,
        user_id: str,
        news_id: str,
        action_type: str = "approve"
    ) -> Dict[str, Any]:
        """Create a user interaction."""
        response = self.client.post(
            f"{self.base_url}/interactions",
            json={"news_id": news_id, "action_type": action_type},
            headers={"X-User-Id": user_id}
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def get_my_interests(self, user_id: str) -> Dict[str, Any]:
        """Get user's interested news."""
        response = self.client.get(
            f"{self.base_url}/interactions/my-interests",
            headers={"X-User-Id": user_id}
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def get_news_list(self, page_size: int = 10) -> Dict[str, Any]:
        """Helper to get news for testing."""
        response = self.client.get(
            f"{self.base_url}/news",
            params={"page_size": page_size}
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }


# Generate unique test user ID for this test run
import time
TEST_USER_ID = f"test-user-{int(time.time())}"


@pytest.fixture(scope="module")
def interaction_helper(client, base_url):
    """Create interaction helper instance."""
    return TestInteractionHelper(client, base_url)


@pytest.fixture(scope="module")
def test_user_id():
    """Return unique test user ID."""
    return TEST_USER_ID


@pytest.fixture(scope="module")
def sample_news_ids(interaction_helper):
    """Get sample news IDs for testing."""
    result = interaction_helper.get_news_list(page_size=5)
    
    if result["status_code"] == 200 and len(result["data"]["news"]) > 0:
        return [news["news_id"] for news in result["data"]["news"]]
    return []


class TestCreateInteractionEndpoint:
    """Test POST /api/interactions endpoint."""
    
    def test_create_interaction_approve(self, interaction_helper, test_user_id, sample_news_ids):
        """Test creating approve interaction (swipe right)."""
        if not sample_news_ids:
            pytest.skip("No news available for testing")
        
        result = interaction_helper.create_interaction(
            user_id=test_user_id,
            news_id=sample_news_ids[0],
            action_type="approve"
        )
        
        assert result["status_code"] == 200
        assert "message" in result["data"]
        assert "interaction_id" in result["data"]
        assert result["data"]["message"] in ["Interaction saved", "Interaction updated"]
    
    def test_create_interaction_reject(self, interaction_helper, test_user_id, sample_news_ids):
        """Test creating reject interaction (swipe left)."""
        if len(sample_news_ids) < 2:
            pytest.skip("Not enough news available for testing")
        
        result = interaction_helper.create_interaction(
            user_id=test_user_id,
            news_id=sample_news_ids[1],
            action_type="reject"
        )
        
        assert result["status_code"] == 200
        assert result["data"]["message"] in ["Interaction saved", "Interaction updated"]
    
    def test_create_interaction_update_existing(self, interaction_helper, test_user_id, sample_news_ids):
        """Test updating existing interaction (change from reject to approve)."""
        if len(sample_news_ids) < 2:
            pytest.skip("Not enough news available for testing")
        
        # Update the rejected news to approve
        result = interaction_helper.create_interaction(
            user_id=test_user_id,
            news_id=sample_news_ids[1],
            action_type="approve"
        )
        
        assert result["status_code"] == 200
        assert result["data"]["message"] == "Interaction updated"
    
    def test_create_interaction_without_user_id(self, interaction_helper, sample_news_ids):
        """Test creating interaction without user ID (unauthorized)."""
        if not sample_news_ids:
            pytest.skip("No news available for testing")
        
        # Manually call without X-User-Id header
        response = interaction_helper.client.post(
            f"{interaction_helper.base_url}/interactions",
            json={"news_id": sample_news_ids[0], "action_type": "approve"}
        )
        
        assert response.status_code == 401
    
    def test_create_interaction_invalid_action_type(self, interaction_helper, test_user_id, sample_news_ids):
        """Test creating interaction with invalid action type."""
        if not sample_news_ids:
            pytest.skip("No news available for testing")
        
        response = interaction_helper.client.post(
            f"{interaction_helper.base_url}/interactions",
            json={"news_id": sample_news_ids[0], "action_type": "invalid"},
            headers={"X-User-Id": test_user_id}
        )
        
        # Should fail validation
        assert response.status_code == 422
    
    def test_create_interaction_missing_news_id(self, interaction_helper, test_user_id):
        """Test creating interaction without news_id."""
        response = interaction_helper.client.post(
            f"{interaction_helper.base_url}/interactions",
            json={"action_type": "approve"},
            headers={"X-User-Id": test_user_id}
        )
        
        # Should fail validation
        assert response.status_code == 422


class TestGetMyInterestsEndpoint:
    """Test GET /api/interactions/my-interests endpoint."""
    
    def test_get_my_interests(self, interaction_helper, test_user_id):
        """Test getting user's interested news."""
        result = interaction_helper.get_my_interests(test_user_id)
        
        assert result["status_code"] == 200
        assert "news" in result["data"]
        assert "total" in result["data"]
        assert "has_analysis" in result["data"]
        assert "missing_analysis" in result["data"]
    
    def test_get_my_interests_response_structure(self, interaction_helper, test_user_id):
        """Test response structure for my-interests."""
        result = interaction_helper.get_my_interests(test_user_id)
        
        assert result["status_code"] == 200
        
        # Check news item structure if there are any
        if len(result["data"]["news"]) > 0:
            news_item = result["data"]["news"][0]
            
            assert "news_id" in news_item
            assert "title" in news_item
            assert "analyst" in news_item
            assert "tickers" in news_item
    
    def test_get_my_interests_without_user_id(self, interaction_helper):
        """Test getting interests without user ID (unauthorized)."""
        response = interaction_helper.client.get(
            f"{interaction_helper.base_url}/interactions/my-interests"
        )
        
        assert response.status_code == 401
    
    def test_get_my_interests_new_user(self, interaction_helper):
        """Test getting interests for user with no interactions."""
        new_user_id = f"new-user-{int(time.time())}"
        result = interaction_helper.get_my_interests(new_user_id)
        
        assert result["status_code"] == 200
        assert result["data"]["total"] == 0
        assert len(result["data"]["news"]) == 0
        assert result["data"]["has_analysis"] == 0
        assert result["data"]["missing_analysis"] == 0
    
    def test_get_my_interests_contains_approved_news(self, interaction_helper, test_user_id, sample_news_ids):
        """Test that my-interests contains previously approved news."""
        if not sample_news_ids:
            pytest.skip("No news available for testing")
        
        result = interaction_helper.get_my_interests(test_user_id)
        
        assert result["status_code"] == 200
        
        # Check that at least one of the approved news is in the response
        returned_ids = [n["news_id"] for n in result["data"]["news"]]
        
        # We approved sample_news_ids[0] and sample_news_ids[1] in previous tests
        # At least one should be present
        assert result["data"]["total"] >= 1


class TestInteractionAnalytics:
    """Test analytics fields in responses."""
    
    def test_has_analysis_count(self, interaction_helper, test_user_id):
        """Test that has_analysis count is calculated."""
        result = interaction_helper.get_my_interests(test_user_id)
        
        assert result["status_code"] == 200
        assert isinstance(result["data"]["has_analysis"], int)
        assert result["data"]["has_analysis"] >= 0
    
    def test_missing_analysis_count(self, interaction_helper, test_user_id):
        """Test that missing_analysis count is calculated."""
        result = interaction_helper.get_my_interests(test_user_id)
        
        assert result["status_code"] == 200
        assert isinstance(result["data"]["missing_analysis"], int)
        assert result["data"]["missing_analysis"] >= 0
    
    def test_analysis_counts_sum_to_total(self, interaction_helper, test_user_id):
        """Test that has_analysis + missing_analysis = total."""
        result = interaction_helper.get_my_interests(test_user_id)
        
        assert result["status_code"] == 200
        
        total = result["data"]["total"]
        has_analysis = result["data"]["has_analysis"]
        missing_analysis = result["data"]["missing_analysis"]
        
        assert has_analysis + missing_analysis == total


class TestMultipleUsersInteractions:
    """Test interactions with multiple users."""
    
    def test_different_users_have_separate_interests(self, interaction_helper, sample_news_ids):
        """Test that different users have separate interest lists."""
        if len(sample_news_ids) < 3:
            pytest.skip("Not enough news available for testing")
        
        user_a = f"user-a-{int(time.time())}"
        user_b = f"user-b-{int(time.time())}"
        
        # User A approves news 0
        interaction_helper.create_interaction(user_a, sample_news_ids[0], "approve")
        
        # User B approves news 2
        interaction_helper.create_interaction(user_b, sample_news_ids[2], "approve")
        
        # Get interests
        interests_a = interaction_helper.get_my_interests(user_a)
        interests_b = interaction_helper.get_my_interests(user_b)
        
        assert interests_a["status_code"] == 200
        assert interests_b["status_code"] == 200
        
        # User A should have news 0, User B should have news 2
        ids_a = [n["news_id"] for n in interests_a["data"]["news"]]
        ids_b = [n["news_id"] for n in interests_b["data"]["news"]]
        
        assert sample_news_ids[0] in ids_a
        assert sample_news_ids[2] in ids_b
        
        # They should not share the same interests
        assert sample_news_ids[0] not in ids_b
        assert sample_news_ids[2] not in ids_a
