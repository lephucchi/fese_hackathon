"""
Custom exceptions and handlers for FastAPI.
"""
from .base import (
    APIException,
    NotFoundException,
    ValidationException,
    AuthenticationException,
    RateLimitException,
)
from .handlers import register_exception_handlers

__all__ = [
    "APIException",
    "NotFoundException",
    "ValidationException",
    "AuthenticationException",
    "RateLimitException",
    "register_exception_handlers",
]
