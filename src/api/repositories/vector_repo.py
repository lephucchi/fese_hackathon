"""
Vector search repository for RPC function calls.
"""
from typing import List, Dict, Any, Optional

# Note: 'supabase' on line below refers to the pip package (supabase-py)
# Import using sys.path workaround or direct dict access (avoiding type hints for now)
try:
    from supabase import Client
except ImportError:
    # Fallback if there's a naming conflict
    import sys
    import importlib
    Client = importlib.import_module('supabase._sync.client').SyncClient


class VectorRepository:
    """Repository for vector similarity search using Supabase RPC functions."""
    
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def match_finance_documents(
        self,
        query_embedding: str,
        match_count: int = 10,
        match_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        Search finance index using vector similarity.
        
        Args:
            query_embedding: Query embedding vector as string
            match_count: Number of results to return
            match_threshold: Minimum similarity threshold
            filters: Optional metadata filters
            
        Returns:
            List of matching documents with similarity scores
        """
        params = {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "match_threshold": match_threshold,
        }
        
        if filters:
            params["filter"] = filters
        
        response = self.supabase.rpc("match_finance_documents", params).execute()
        return response.data
    
    async def match_news_documents(
        self,
        query_embedding: str,
        match_count: int = 10,
        match_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search news index using vector similarity."""
        params = {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "match_threshold": match_threshold,
        }
        
        if filters:
            params["filter"] = filters
        
        response = self.supabase.rpc("match_news_documents", params).execute()
        return response.data
    
    async def match_legal_documents(
        self,
        query_embedding: str,
        match_count: int = 10,
        match_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search legal index using vector similarity."""
        params = {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "match_threshold": match_threshold,
        }
        
        if filters:
            params["filter"] = filters
        
        response = self.supabase.rpc("match_legal_documents", params).execute()
        return response.data
    
    async def match_glossary(
        self,
        query_embedding: str,
        match_count: int = 10,
        match_threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search glossary index using vector similarity."""
        params = {
            "query_embedding": query_embedding,
            "match_count": match_count,
            "match_threshold": match_threshold,
        }
        
        if filters:
            params["filter"] = filters
        
        response = self.supabase.rpc("match_glossary", params).execute()
        return response.data
