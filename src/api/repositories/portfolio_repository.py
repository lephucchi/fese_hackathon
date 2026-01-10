"""
Portfolio Repository - Data access layer for portfolios table.

Handles all database operations for user stock portfolios.
"""
from typing import Optional, List, Dict, Any
from supabase import Client

from .base import BaseRepository


class PortfolioRepository(BaseRepository):
    """Repository for portfolios table operations."""
    
    def __init__(self, supabase: Client):
        """
        Initialize portfolio repository.
        
        Args:
            supabase: Supabase client instance
        """
        super().__init__(supabase, "portfolios")
    
    async def find_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Find all portfolio positions for a user.
        
        Args:
            user_id: User's UUID
            
        Returns:
            List of portfolio positions
        """
        response = self.supabase.table(self.table_name)\
            .select("*")\
            .eq("user_id", user_id)\
            .order("updated_at", desc=True)\
            .execute()
        
        return response.data if response.data else []
    
    async def find_by_id(self, portfolio_id: str) -> Optional[Dict[str, Any]]:
        """
        Find portfolio position by ID.
        
        Args:
            portfolio_id: Portfolio UUID
            
        Returns:
            Portfolio dict if found, None otherwise
        """
        response = self.supabase.table(self.table_name)\
            .select("*")\
            .eq("portfolio_id", portfolio_id)\
            .execute()
        
        return response.data[0] if response.data else None
    
    async def find_by_user_and_ticker(
        self, 
        user_id: str, 
        ticker: str
    ) -> Optional[Dict[str, Any]]:
        """
        Find specific position by user and ticker.
        
        Args:
            user_id: User's UUID
            ticker: Stock ticker symbol
            
        Returns:
            Portfolio dict if found, None otherwise
        """
        response = self.supabase.table(self.table_name)\
            .select("*")\
            .eq("user_id", user_id)\
            .eq("ticker", ticker.upper())\
            .execute()
        
        return response.data[0] if response.data else None
    
    async def create(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new portfolio position.
        
        Args:
            data: Position data (user_id, ticker, volume, avg_buy_price)
            
        Returns:
            Created portfolio dict
        """
        # Normalize ticker to uppercase
        if "ticker" in data:
            data["ticker"] = data["ticker"].upper()
        
        response = self.supabase.table(self.table_name)\
            .insert(data)\
            .execute()
        
        return response.data[0] if response.data else {}
    
    async def update(
        self, 
        portfolio_id: str, 
        data: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        """
        Update portfolio position.
        
        Args:
            portfolio_id: Portfolio UUID
            data: Fields to update
            
        Returns:
            Updated portfolio dict
        """
        response = self.supabase.table(self.table_name)\
            .update(data)\
            .eq("portfolio_id", portfolio_id)\
            .execute()
        
        return response.data[0] if response.data else None
    
    async def delete(self, portfolio_id: str) -> bool:
        """
        Delete portfolio position.
        
        Args:
            portfolio_id: Portfolio UUID
            
        Returns:
            True if deleted successfully
        """
        response = self.supabase.table(self.table_name)\
            .delete()\
            .eq("portfolio_id", portfolio_id)\
            .execute()
        
        return len(response.data) > 0 if response.data else False
    
    async def count_by_user(self, user_id: str) -> int:
        """
        Count positions for a user.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Number of positions
        """
        response = self.supabase.table(self.table_name)\
            .select("portfolio_id", count="exact")\
            .eq("user_id", user_id)\
            .execute()
        
        return response.count if hasattr(response, 'count') and response.count else len(response.data)
