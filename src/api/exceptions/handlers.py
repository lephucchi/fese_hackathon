"""
Exception handlers for FastAPI.
"""
import logging
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from .base import APIException

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI):
    """Register all exception handlers with FastAPI app."""
    
    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        """Handle custom API exceptions."""
        logger.warning(
            f"API Exception: {exc.error_code} - {exc.message}",
            extra={"details": exc.details}
        )
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": exc.error_code,
                "message": exc.message,
                "details": exc.details
            }
        )
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        """Handle uncaught exceptions."""
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "internal_error",
                "message": "An unexpected error occurred. Please try again."
            }
        )
