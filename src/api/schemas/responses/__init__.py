"""
Response schemas package.
"""
from .query import QueryResponse, Citation, ResponseMetadata
from .common import HealthResponse, ErrorResponse
from .auth import (
    AuthResponse,
    UserInfo,
    RoleInfo,
    RefreshResponse,
    LogoutResponse,
    SessionInfo,
    SessionsResponse,
)
from .news import (
    TickerInfo,
    NewsItem,
    NewsListResponse,
    NewsDetailResponse,
    NewsByTickerResponse,
    SentimentStats,
    NewsStatsResponse,
)
from .interaction import (
    InteractionResponse,
    UserInterestsResponse,
)

__all__ = [
    "QueryResponse",
    "Citation",
    "ResponseMetadata",
    "HealthResponse",
    "ErrorResponse",
    # Auth
    "AuthResponse",
    "UserInfo",
    "RoleInfo",
    "RefreshResponse",
    "LogoutResponse",
    "SessionInfo",
    "SessionsResponse",
    # News
    "TickerInfo",
    "NewsItem",
    "NewsListResponse",
    "NewsDetailResponse",
    "NewsByTickerResponse",
    "SentimentStats",
    "NewsStatsResponse",
    # Interaction
    "InteractionResponse",
    "UserInterestsResponse",
]


