"""
Request schemas package.
"""
from .query import QueryRequest, QueryOptions
from .auth import RegisterRequest, LoginRequest, ChangePasswordRequest
from .user import UpdateProfileRequest

__all__ = [
    "QueryRequest",
    "QueryOptions",
    # Auth
    "RegisterRequest",
    "LoginRequest",
    "ChangePasswordRequest",
    # User
    "UpdateProfileRequest",
]

