"""
FastAPI Backend Package.

Provides REST API for the Multi-Index RAG pipeline.

Usage:
    uvicorn src.api.main:app --reload --port 8000

Endpoints:
    POST /api/query  - Process query through RAG pipeline
    GET  /api/health - Health check
    GET  /api/routes - Available indices
"""
from .main import app

__all__ = ["app"]
