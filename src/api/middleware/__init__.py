"""
Middleware package.
"""
from .logging import log_requests_middleware

__all__ = [
    "log_requests_middleware",
]
