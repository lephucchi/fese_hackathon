"""
Authentication Routes - API endpoints for user authentication.

Handles registration, login, logout, and token refresh.
"""
import logging
import os
from fastapi import APIRouter, Depends, Response, Request
from fastapi.responses import JSONResponse

from ..schemas.requests import RegisterRequest, LoginRequest
from ..schemas.responses import AuthResponse, UserInfo, RoleInfo, LogoutResponse, RefreshResponse
from ..services.auth_service import AuthService
from ..repositories.user_repository import UserRepository
from ..dependencies import get_supabase_client
from ..exceptions import AuthenticationException
from ..utils.jwt import verify_refresh_token, create_access_token

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Authentication"], prefix="/auth")

# Cookie settings
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "true").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")
ACCESS_TOKEN_MAX_AGE = 15 * 60  # 15 minutes
REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60  # 7 days


def get_auth_service() -> AuthService:
    """Dependency to get AuthService instance."""
    supabase = get_supabase_client()
    user_repo = UserRepository(supabase)
    return AuthService(user_repo)


def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str
) -> None:
    """
    Set authentication cookies on the response.
    
    Args:
        response: FastAPI Response object
        access_token: JWT access token
        refresh_token: JWT refresh token
    """
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_MAX_AGE,
        path="/"
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=REFRESH_TOKEN_MAX_AGE,
        path="/api/auth"  # Only sent to auth endpoints
    )


def _clear_auth_cookies(response: Response) -> None:
    """Clear authentication cookies."""
    response.delete_cookie(key="access_token", path="/")
    response.delete_cookie(key="refresh_token", path="/api/auth")


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    summary="Register new user",
    description="""
    Create a new user account.
    
    - Validates email format and uniqueness
    - Validates password strength (min 8 chars, uppercase, lowercase, number)
    - Auto-generates avatar from user's initials
    - Assigns default role (Normal)
    - Returns tokens in both response body and HTTP-only cookies
    """
)
async def register(
    request: RegisterRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Register a new user."""
    logger.info(f"Registration request for: {request.email}")
    
    result = await auth_service.register(
        email=request.email,
        password=request.password,
        first_name=request.first_name,
        last_name=request.last_name,
        display_name=request.display_name
    )
    
    # Set cookies
    _set_auth_cookies(response, result["access_token"], result["refresh_token"])
    
    # Build response with role info
    user_data = result["user"]
    role_info = None
    if user_data.get("role"):
        role_info = RoleInfo(**user_data["role"])
    
    return AuthResponse(
        message="Registration successful",
        user=UserInfo(
            user_id=user_data["user_id"],
            email=user_data["email"],
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            display_name=user_data.get("display_name"),
            avatar_url=user_data.get("avatar_url"),
            risk_appetite=user_data.get("risk_appetite"),
            role=role_info,
            created_at=user_data.get("created_at")
        ),
        access_token=result["access_token"],
        refresh_token=result["refresh_token"]
    )


@router.post(
    "/login",
    response_model=AuthResponse,
    summary="User login",
    description="""
    Authenticate user with email and password.
    
    - Validates credentials
    - Returns tokens in both response body (for mobile) and HTTP-only cookies (for web)
    - Access token expires in 15 minutes
    - Refresh token expires in 7 days
    """
)
async def login(
    request: LoginRequest,
    response: Response,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Login user and return tokens."""
    logger.info(f"Login request for: {request.email}")
    
    result = await auth_service.login(
        email=request.email,
        password=request.password
    )
    
    # Set cookies
    _set_auth_cookies(response, result["access_token"], result["refresh_token"])
    
    # Build response with role info
    user_data = result["user"]
    role_info = None
    if user_data.get("role"):
        role_info = RoleInfo(**user_data["role"])
    
    return AuthResponse(
        message="Login successful",
        user=UserInfo(
            user_id=user_data["user_id"],
            email=user_data["email"],
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            display_name=user_data.get("display_name"),
            avatar_url=user_data.get("avatar_url"),
            risk_appetite=user_data.get("risk_appetite"),
            role=role_info,
            created_at=user_data.get("created_at")
        ),
        access_token=result["access_token"],
        refresh_token=result["refresh_token"]
    )


@router.post(
    "/logout",
    response_model=LogoutResponse,
    summary="User logout",
    description="Logout user and clear authentication cookies."
)
async def logout(response: Response):
    """Logout user by clearing cookies."""
    logger.info("Logout request")
    
    _clear_auth_cookies(response)
    
    return LogoutResponse(message="Logout successful")


@router.post(
    "/refresh",
    response_model=RefreshResponse,
    summary="Refresh access token",
    description="""
    Get a new access token using refresh token.
    
    - Refresh token can be sent via cookie or Authorization header
    - Returns new access token in both body and cookie
    """
)
async def refresh_token(
    request: Request,
    response: Response
):
    """Refresh access token using refresh token."""
    logger.info("Token refresh request")
    
    # Get refresh token from cookie or header
    refresh_token = request.cookies.get("refresh_token")
    
    if not refresh_token:
        # Try Authorization header
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            refresh_token = auth_header.split(" ")[1]
    
    if not refresh_token:
        raise AuthenticationException(message="Refresh token required")
    
    # Verify refresh token
    payload = verify_refresh_token(refresh_token)
    if not payload:
        _clear_auth_cookies(response)
        raise AuthenticationException(message="Invalid or expired refresh token")
    
    # Create new access token
    token_data = {
        "sub": payload["sub"],
        "email": payload.get("email", ""),
        "role_id": payload.get("role_id", 1)
    }
    new_access_token = create_access_token(token_data)
    
    # Update access token cookie
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,
        max_age=ACCESS_TOKEN_MAX_AGE,
        path="/"
    )
    
    return RefreshResponse(
        message="Token refreshed",
        access_token=new_access_token
    )


@router.get(
    "/me",
    response_model=AuthResponse,
    summary="Get current user",
    description="""
    Get current authenticated user info from access token.
    
    - Requires valid access token (cookie or Authorization header)
    - Returns user info with role
    """
)
async def get_current_user(
    request: Request,
    auth_service: AuthService = Depends(get_auth_service)
):
    """Get current authenticated user info."""
    from ..middleware.auth import get_token_from_request
    from ..utils.jwt import verify_access_token
    
    token = get_token_from_request(request)
    if not token:
        raise AuthenticationException(message="Authentication required")
    
    payload = verify_access_token(token)
    if not payload:
        raise AuthenticationException(message="Invalid or expired token")
    
    user_id = payload.get("sub")
    if not user_id:
        raise AuthenticationException(message="Invalid token payload")
    
    # Get user from database
    user_data = await auth_service.get_user_by_id(user_id)
    if not user_data:
        raise AuthenticationException(message="User not found")
    
    # Build response with role info
    role_info = None
    if user_data.get("role"):
        role_info = RoleInfo(**user_data["role"])
    
    return AuthResponse(
        message="User retrieved",
        user=UserInfo(
            user_id=user_data["user_id"],
            email=user_data["email"],
            first_name=user_data.get("first_name"),
            last_name=user_data.get("last_name"),
            display_name=user_data.get("display_name"),
            avatar_url=user_data.get("avatar_url"),
            risk_appetite=user_data.get("risk_appetite"),
            role=role_info,
            created_at=user_data.get("created_at")
        )
    )
