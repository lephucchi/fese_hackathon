"""
Base exception classes.
"""


class APIException(Exception):
    """Base exception for all API errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: str = "api_error",
        details: dict = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}
        super().__init__(message)


class NotFoundException(APIException):
    """Resource not found."""
    
    def __init__(self, message: str = "Resource not found", details: dict = None):
        super().__init__(
            message=message,
            status_code=404,
            error_code="not_found",
            details=details
        )


class ValidationException(APIException):
    """Request validation failed."""
    
    def __init__(self, message: str = "Validation error", details: dict = None):
        super().__init__(
            message=message,
            status_code=400,
            error_code="validation_error",
            details=details
        )


class AuthenticationException(APIException):
    """Authentication failed."""
    
    def __init__(self, message: str = "Authentication required", details: dict = None):
        super().__init__(
            message=message,
            status_code=401,
            error_code="authentication_error",
            details=details
        )


class RateLimitException(APIException):
    """Rate limit exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: dict = None):
        super().__init__(
            message=message,
            status_code=429,
            error_code="rate_limit_exceeded",
            details=details
        )
