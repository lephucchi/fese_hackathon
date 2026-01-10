"""
Request schemas package.
"""
from .query import QueryRequest, QueryOptions
from .auth import RegisterRequest, LoginRequest, ChangePasswordRequest
from .user import UpdateProfileRequest
from .interaction import CreateInteractionRequest
from .portfolio import CreatePortfolioRequest, UpdatePortfolioRequest

__all__ = [
    "QueryRequest",
    "QueryOptions",
    # Auth
    "RegisterRequest",
    "LoginRequest",
    "ChangePasswordRequest",
    # User
    "UpdateProfileRequest",
    # Interaction
    "CreateInteractionRequest",
    # Portfolio
    "CreatePortfolioRequest",
    "UpdatePortfolioRequest",
]


