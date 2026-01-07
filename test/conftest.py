"""
Test configuration and fixtures for authentication tests.
"""
import os
import sys
import time
import pytest
from typing import Generator, Dict, Any
from fastapi.testclient import TestClient

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.api.main import app

# Generate unique suffix for test emails to avoid conflicts on re-runs
TEST_RUN_ID = str(int(time.time()))[-6:]


@pytest.fixture(scope="session")
def client() -> Generator[TestClient, None, None]:
    """Create test client for the FastAPI app."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="session")
def base_url() -> str:
    """Base URL for API endpoints."""
    return "/api"


def get_test_users() -> Dict[str, Dict[str, Any]]:
    """Generate test users with unique emails for this run."""
    return {
        "admin": {
            "email": f"admin_{TEST_RUN_ID}@test.com",
            "password": "AdminPass123!",
            "first_name": "Admin",
            "last_name": "User",
            "display_name": "Admin User"
        },
        "normal_1": {
            "email": f"user1_{TEST_RUN_ID}@test.com",
            "password": "UserPass123!",
            "first_name": "Nguyen",
            "last_name": "Van A",
            "display_name": "Nguyen Van A"
        },
        "normal_2": {
            "email": f"user2_{TEST_RUN_ID}@test.com",
            "password": "UserPass123!",
            "first_name": "Tran",
            "last_name": "Thi B",
            "display_name": "Tran Thi B"
        },
        "normal_3": {
            "email": f"user3_{TEST_RUN_ID}@test.com",
            "password": "UserPass123!",
            "first_name": "Le",
            "last_name": "Van C",
            "display_name": "Le Van C"
        },
        "normal_4": {
            "email": f"user4_{TEST_RUN_ID}@test.com",
            "password": "UserPass123!",
            "first_name": "Pham",
            "last_name": "Thi D",
            "display_name": "Pham Thi D"
        },
        "normal_5": {
            "email": f"user5_{TEST_RUN_ID}@test.com",
            "password": "UserPass123!",
            "first_name": "Hoang",
            "last_name": "Van E",
            "display_name": "Hoang Van E"
        }
    }


@pytest.fixture(scope="session")
def test_users() -> Dict[str, Dict[str, Any]]:
    """Return test user data with unique emails."""
    return get_test_users()


class AuthHelper:
    """Helper class for authentication operations in tests."""
    
    def __init__(self, client: TestClient, base_url: str):
        self.client = client
        self.base_url = base_url
        self.registered_users: Dict[str, Dict[str, Any]] = {}
    
    def register(self, user_key: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Register a user and store the result."""
        response = self.client.post(
            f"{self.base_url}/auth/register",
            json=user_data
        )
        result = {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None,
            "cookies": dict(response.cookies)
        }
        if response.status_code == 201:
            self.registered_users[user_key] = {
                **user_data,
                **result["data"].get("user", {}),
                "access_token": result["data"].get("access_token"),
                "refresh_token": result["data"].get("refresh_token")
            }
        return result
    
    def login(self, email: str, password: str) -> Dict[str, Any]:
        """Login and return result with cookies."""
        response = self.client.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None,
            "cookies": dict(response.cookies)
        }
    
    def logout(self, cookies: Dict[str, str] = None) -> Dict[str, Any]:
        """Logout and return result."""
        response = self.client.post(
            f"{self.base_url}/auth/logout",
            cookies=cookies
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None,
            "cookies": dict(response.cookies)
        }
    
    def get_profile(self, access_token: str = None, cookies: Dict[str, str] = None) -> Dict[str, Any]:
        """Get current user profile."""
        headers = {}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = self.client.get(
            f"{self.base_url}/users/me",
            headers=headers,
            cookies=cookies
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def update_profile(self, update_data: Dict[str, Any], access_token: str = None, cookies: Dict[str, str] = None) -> Dict[str, Any]:
        """Update user profile."""
        headers = {}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = self.client.put(
            f"{self.base_url}/users/me",
            json=update_data,
            headers=headers,
            cookies=cookies
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def change_password(self, current_password: str, new_password: str, access_token: str = None, cookies: Dict[str, str] = None) -> Dict[str, Any]:
        """Change user password."""
        headers = {}
        if access_token:
            headers["Authorization"] = f"Bearer {access_token}"
        
        response = self.client.put(
            f"{self.base_url}/users/me/password",
            json={
                "current_password": current_password,
                "new_password": new_password,
                "confirm_password": new_password
            },
            headers=headers,
            cookies=cookies
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None
        }
    
    def refresh_token(self, refresh_token: str = None, cookies: Dict[str, str] = None) -> Dict[str, Any]:
        """Refresh access token."""
        headers = {}
        if refresh_token:
            headers["Authorization"] = f"Bearer {refresh_token}"
        
        response = self.client.post(
            f"{self.base_url}/auth/refresh",
            headers=headers,
            cookies=cookies
        )
        return {
            "status_code": response.status_code,
            "data": response.json() if response.status_code < 500 else None,
            "cookies": dict(response.cookies)
        }


@pytest.fixture(scope="session")
def auth_helper(client: TestClient, base_url: str) -> AuthHelper:
    """Create auth helper instance."""
    return AuthHelper(client, base_url)
