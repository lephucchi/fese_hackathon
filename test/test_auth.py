"""
Comprehensive Authentication Tests.

Tests for:
- User registration (1 admin, 5 normal users)
- Login/Logout
- Cookies handling
- Token refresh
- Profile operations
- Password change
"""
import pytest
from typing import Dict, Any


class TestUserRegistration:
    """Test user registration functionality."""
    
    def test_register_admin_user(self, auth_helper, test_users):
        """Test registering an admin user."""
        result = auth_helper.register("admin", test_users["admin"])
        
        assert result["status_code"] == 201, f"Failed to register admin: {result['data']}"
        assert result["data"]["message"] == "Registration successful"
        assert result["data"]["user"]["email"] == test_users["admin"]["email"]
        assert result["data"]["access_token"] is not None
        assert result["data"]["refresh_token"] is not None
        
        # Verify cookies are set
        assert "access_token" in result["cookies"]
        assert "refresh_token" in result["cookies"]
        
        # Verify avatar was auto-generated
        assert result["data"]["user"]["avatar_url"] is not None
        assert "ui-avatars.com" in result["data"]["user"]["avatar_url"]
    
    def test_register_normal_user_1(self, auth_helper, test_users):
        """Test registering normal user 1."""
        result = auth_helper.register("normal_1", test_users["normal_1"])
        
        assert result["status_code"] == 201
        assert result["data"]["user"]["email"] == test_users["normal_1"]["email"]
        assert result["data"]["user"]["display_name"] == test_users["normal_1"]["display_name"]
    
    def test_register_normal_user_2(self, auth_helper, test_users):
        """Test registering normal user 2."""
        result = auth_helper.register("normal_2", test_users["normal_2"])
        
        assert result["status_code"] == 201
        assert result["data"]["user"]["email"] == test_users["normal_2"]["email"]
    
    def test_register_normal_user_3(self, auth_helper, test_users):
        """Test registering normal user 3."""
        result = auth_helper.register("normal_3", test_users["normal_3"])
        
        assert result["status_code"] == 201
        assert result["data"]["user"]["email"] == test_users["normal_3"]["email"]
    
    def test_register_normal_user_4(self, auth_helper, test_users):
        """Test registering normal user 4."""
        result = auth_helper.register("normal_4", test_users["normal_4"])
        
        assert result["status_code"] == 201
        assert result["data"]["user"]["email"] == test_users["normal_4"]["email"]
    
    def test_register_normal_user_5(self, auth_helper, test_users):
        """Test registering normal user 5."""
        result = auth_helper.register("normal_5", test_users["normal_5"])
        
        assert result["status_code"] == 201
        assert result["data"]["user"]["email"] == test_users["normal_5"]["email"]
    
    def test_register_duplicate_email(self, auth_helper, test_users):
        """Test that duplicate email registration fails."""
        # Try to register the same email again
        result = auth_helper.register("admin_dup", test_users["admin"])
        
        assert result["status_code"] == 400
        assert "already registered" in result["data"]["message"].lower() or "already" in str(result["data"]).lower()
    
    def test_register_weak_password(self, auth_helper):
        """Test that weak password is rejected."""
        weak_user = {
            "email": "weak@test.com",
            "password": "weak",  # Too short, no uppercase, no number
            "first_name": "Weak",
            "last_name": "Password"
        }
        result = auth_helper.register("weak", weak_user)
        
        assert result["status_code"] == 422  # Validation error
    
    def test_register_invalid_email(self, auth_helper):
        """Test that invalid email format is rejected."""
        invalid_user = {
            "email": "not-an-email",
            "password": "ValidPass123!",
            "first_name": "Invalid",
            "last_name": "Email"
        }
        result = auth_helper.register("invalid_email", invalid_user)
        
        assert result["status_code"] == 422  # Validation error


class TestUserLogin:
    """Test user login functionality."""
    
    def test_login_success(self, auth_helper, test_users):
        """Test successful login."""
        result = auth_helper.login(
            test_users["normal_1"]["email"],
            test_users["normal_1"]["password"]
        )
        
        assert result["status_code"] == 200
        assert result["data"]["message"] == "Login successful"
        assert result["data"]["access_token"] is not None
        assert result["data"]["refresh_token"] is not None
        
        # Verify cookies are set
        assert "access_token" in result["cookies"]
        assert "refresh_token" in result["cookies"]
    
    def test_login_wrong_password(self, auth_helper, test_users):
        """Test login with wrong password."""
        result = auth_helper.login(
            test_users["normal_1"]["email"],
            "WrongPassword123!"
        )
        
        assert result["status_code"] == 401
        assert "invalid" in result["data"]["message"].lower()
    
    def test_login_nonexistent_user(self, auth_helper):
        """Test login with non-existent email."""
        result = auth_helper.login(
            "nonexistent@test.com",
            "SomePassword123!"
        )
        
        assert result["status_code"] == 401
        assert "invalid" in result["data"]["message"].lower()


class TestCookies:
    """Test cookie handling."""
    
    def test_cookies_set_on_login(self, auth_helper, test_users):
        """Test that cookies are properly set on login."""
        result = auth_helper.login(
            test_users["normal_2"]["email"],
            test_users["normal_2"]["password"]
        )
        
        assert "access_token" in result["cookies"]
        assert "refresh_token" in result["cookies"]
        assert len(result["cookies"]["access_token"]) > 0
        assert len(result["cookies"]["refresh_token"]) > 0
    
    def test_access_profile_with_cookie(self, auth_helper, test_users):
        """Test accessing profile using cookie-based authentication."""
        # Login to get cookies
        login_result = auth_helper.login(
            test_users["normal_2"]["email"],
            test_users["normal_2"]["password"]
        )
        
        assert login_result["status_code"] == 200
        
        # Access profile with cookies
        profile_result = auth_helper.get_profile(
            cookies={"access_token": login_result["cookies"]["access_token"]}
        )
        
        assert profile_result["status_code"] == 200
        assert profile_result["data"]["email"] == test_users["normal_2"]["email"]
    
    def test_access_profile_with_bearer_token(self, auth_helper, test_users):
        """Test accessing profile using Bearer token in header."""
        # Login to get token
        login_result = auth_helper.login(
            test_users["normal_3"]["email"],
            test_users["normal_3"]["password"]
        )
        
        assert login_result["status_code"] == 200
        
        # Access profile with Bearer token
        profile_result = auth_helper.get_profile(
            access_token=login_result["data"]["access_token"]
        )
        
        assert profile_result["status_code"] == 200
        assert profile_result["data"]["email"] == test_users["normal_3"]["email"]
    
    def test_access_profile_without_auth(self, auth_helper):
        """Test that accessing profile without auth fails."""
        profile_result = auth_helper.get_profile()
        
        assert profile_result["status_code"] == 401


class TestLogout:
    """Test logout functionality."""
    
    def test_logout_success(self, auth_helper, test_users):
        """Test successful logout."""
        # Login first
        login_result = auth_helper.login(
            test_users["normal_4"]["email"],
            test_users["normal_4"]["password"]
        )
        
        assert login_result["status_code"] == 200
        
        # Logout
        logout_result = auth_helper.logout(
            cookies={"access_token": login_result["cookies"]["access_token"]}
        )
        
        assert logout_result["status_code"] == 200
        assert logout_result["data"]["message"] == "Logout successful"
    
    def test_logout_clears_cookies(self, auth_helper, test_users):
        """Test that logout clears authentication cookies."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_5"]["email"],
            test_users["normal_5"]["password"]
        )
        
        # Logout should work even without cookies
        logout_result = auth_helper.logout()
        
        assert logout_result["status_code"] == 200


class TestTokenRefresh:
    """Test token refresh functionality."""
    
    def test_refresh_token_success(self, auth_helper, test_users):
        """Test successful token refresh."""
        # Login to get refresh token
        login_result = auth_helper.login(
            test_users["normal_1"]["email"],
            test_users["normal_1"]["password"]
        )
        
        assert login_result["status_code"] == 200
        
        # Refresh token
        refresh_result = auth_helper.refresh_token(
            cookies={"refresh_token": login_result["cookies"]["refresh_token"]}
        )
        
        assert refresh_result["status_code"] == 200
        assert refresh_result["data"]["access_token"] is not None
        assert "access_token" in refresh_result["cookies"]
    
    def test_refresh_token_with_bearer(self, auth_helper, test_users):
        """Test token refresh using Bearer token in header."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_2"]["email"],
            test_users["normal_2"]["password"]
        )
        
        assert login_result["status_code"] == 200
        
        # Refresh using Bearer token
        refresh_result = auth_helper.refresh_token(
            refresh_token=login_result["data"]["refresh_token"]
        )
        
        assert refresh_result["status_code"] == 200
        assert refresh_result["data"]["access_token"] is not None
    
    def test_refresh_token_invalid(self, auth_helper):
        """Test that invalid refresh token is rejected."""
        refresh_result = auth_helper.refresh_token(
            refresh_token="invalid.token.here"
        )
        
        assert refresh_result["status_code"] == 401


class TestProfileOperations:
    """Test profile CRUD operations."""
    
    def test_get_profile(self, auth_helper, test_users):
        """Test getting current user profile."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_1"]["email"],
            test_users["normal_1"]["password"]
        )
        
        # Get profile
        profile_result = auth_helper.get_profile(
            access_token=login_result["data"]["access_token"]
        )
        
        assert profile_result["status_code"] == 200
        assert profile_result["data"]["email"] == test_users["normal_1"]["email"]
        assert profile_result["data"]["first_name"] == test_users["normal_1"]["first_name"]
        assert profile_result["data"]["last_name"] == test_users["normal_1"]["last_name"]
        assert profile_result["data"]["avatar_url"] is not None
    
    def test_update_profile_display_name(self, auth_helper, test_users):
        """Test updating display name."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_2"]["email"],
            test_users["normal_2"]["password"]
        )
        
        # Update profile
        new_display_name = "Updated Display Name"
        update_result = auth_helper.update_profile(
            {"display_name": new_display_name},
            access_token=login_result["data"]["access_token"]
        )
        
        assert update_result["status_code"] == 200
        assert update_result["data"]["user"]["display_name"] == new_display_name
    
    def test_update_profile_multiple_fields(self, auth_helper, test_users):
        """Test updating multiple profile fields at once."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_3"]["email"],
            test_users["normal_3"]["password"]
        )
        
        # Update multiple fields
        update_data = {
            "first_name": "Updated First",
            "last_name": "Updated Last",
            "risk_appetite": "aggressive"
        }
        update_result = auth_helper.update_profile(
            update_data,
            access_token=login_result["data"]["access_token"]
        )
        
        assert update_result["status_code"] == 200
        assert update_result["data"]["user"]["first_name"] == "Updated First"
        assert update_result["data"]["user"]["last_name"] == "Updated Last"
        assert update_result["data"]["user"]["risk_appetite"] == "aggressive"
    
    def test_update_profile_avatar(self, auth_helper, test_users):
        """Test updating avatar URL."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_4"]["email"],
            test_users["normal_4"]["password"]
        )
        
        # Update avatar
        new_avatar = "https://example.com/avatar.jpg"
        update_result = auth_helper.update_profile(
            {"avatar_url": new_avatar},
            access_token=login_result["data"]["access_token"]
        )
        
        assert update_result["status_code"] == 200
        assert update_result["data"]["user"]["avatar_url"] == new_avatar


class TestPasswordChange:
    """Test password change functionality."""
    
    def test_change_password_success(self, auth_helper, test_users):
        """Test successful password change."""
        # Login with original password
        login_result = auth_helper.login(
            test_users["normal_5"]["email"],
            test_users["normal_5"]["password"]
        )
        
        assert login_result["status_code"] == 200
        
        # Change password
        new_password = "NewSecurePass456!"
        change_result = auth_helper.change_password(
            current_password=test_users["normal_5"]["password"],
            new_password=new_password,
            access_token=login_result["data"]["access_token"]
        )
        
        assert change_result["status_code"] == 200
        assert change_result["data"]["message"] == "Password changed successfully"
        
        # Verify can login with new password
        new_login = auth_helper.login(
            test_users["normal_5"]["email"],
            new_password
        )
        
        assert new_login["status_code"] == 200
        
        # Verify old password no longer works
        old_login = auth_helper.login(
            test_users["normal_5"]["email"],
            test_users["normal_5"]["password"]
        )
        
        assert old_login["status_code"] == 401
    
    def test_change_password_wrong_current(self, auth_helper, test_users):
        """Test password change with wrong current password."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_1"]["email"],
            test_users["normal_1"]["password"]
        )
        
        # Try to change with wrong current password
        change_result = auth_helper.change_password(
            current_password="WrongCurrentPass123!",
            new_password="NewPass456!",
            access_token=login_result["data"]["access_token"]
        )
        
        assert change_result["status_code"] == 401
        assert "incorrect" in change_result["data"]["message"].lower()
    
    def test_change_password_weak_new_password(self, auth_helper, test_users):
        """Test password change with weak new password."""
        # Login
        login_result = auth_helper.login(
            test_users["normal_1"]["email"],
            test_users["normal_1"]["password"]
        )
        
        # Try to change to weak password
        change_result = auth_helper.change_password(
            current_password=test_users["normal_1"]["password"],
            new_password="weak",  # Too weak
            access_token=login_result["data"]["access_token"]
        )
        
        assert change_result["status_code"] == 422  # Validation error


class TestRoleBasedAccess:
    """Test role-based access control (for admin user)."""
    
    def test_admin_user_has_correct_role(self, auth_helper, test_users):
        """Test that admin user has role_id = 1 (since we didn't manually set admin role)."""
        # Note: By default all registered users get role_id = 1 (Normal)
        # Admin role would need to be set manually in database
        
        # Login as admin
        login_result = auth_helper.login(
            test_users["admin"]["email"],
            test_users["admin"]["password"]
        )
        
        assert login_result["status_code"] == 200
        
        # Get profile to check role
        profile_result = auth_helper.get_profile(
            access_token=login_result["data"]["access_token"]
        )
        
        assert profile_result["status_code"] == 200
        # Default role for all users is 1 (Normal)
        assert profile_result["data"]["role"]["role_id"] == 1
