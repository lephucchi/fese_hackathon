"""
Request/Response logging middleware.
"""
import time
import logging
from fastapi import Request

logger = logging.getLogger(__name__)


async def log_requests_middleware(request: Request, call_next):
    """
    Log all incoming requests and responses.
    
    Logs:
    - Request method, path, client IP
    - Response status code, processing time
    """
    start_time = time.time()
    
    # Log request
    logger.info(
        f"Request: {request.method} {request.url.path}",
        extra={
            "method": request.method,
            "path": request.url.path,
            "client_ip": request.client.host if request.client else None
        }
    )
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = (time.time() - start_time) * 1000
    
    # Log response
    logger.info(
        f"Response: {response.status_code} ({process_time:.2f}ms)",
        extra={
            "status_code": response.status_code,
            "process_time_ms": process_time
        }
    )
    
    # Add processing time to response headers
    response.headers["X-Process-Time"] = f"{process_time:.2f}ms"
    
    return response
