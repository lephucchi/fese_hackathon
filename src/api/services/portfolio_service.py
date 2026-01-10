"""
Portfolio Service - Business logic layer for portfolio management.

Orchestrates portfolio operations and calculates allocations.
"""
import logging
from typing import Dict, Any, List

from ..repositories.portfolio_repository import PortfolioRepository

logger = logging.getLogger(__name__)


class PortfolioService:
    """Service for portfolio business logic."""
    
    def __init__(self, portfolio_repo: PortfolioRepository):
        """
        Initialize portfolio service.
        
        Args:
            portfolio_repo: Portfolio repository instance
        """
        self.portfolio_repo = portfolio_repo
    
    async def get_user_portfolio(self, user_id: str) -> Dict[str, Any]:
        """
        Get user's complete portfolio with calculations.
        
        Args:
            user_id: User's UUID
            
        Returns:
            Dict with has_portfolio, items, total_value, position_count
        """
        logger.info(f"Fetching portfolio for user: {user_id}")
        
        positions = await self.portfolio_repo.find_by_user(user_id)
        
        if not positions:
            return {
                "has_portfolio": False,
                "items": [],
                "total_value": 0,
                "position_count": 0
            }
        
        # Calculate market values and total
        total_value = 0
        items = []
        
        for pos in positions:
            market_value = (pos.get("volume", 0) or 0) * (pos.get("avg_buy_price", 0) or 0)
            total_value += market_value
            items.append({
                **pos,
                "market_value": market_value
            })
        
        # Calculate allocation percentages
        for item in items:
            item["allocation_percent"] = (
                (item["market_value"] / total_value * 100) 
                if total_value > 0 else 0
            )
        
        return {
            "has_portfolio": True,
            "items": items,
            "total_value": total_value,
            "position_count": len(items)
        }
    
    async def add_position(
        self, 
        user_id: str, 
        ticker: str, 
        volume: float, 
        avg_buy_price: float
    ) -> Dict[str, Any]:
        """
        Add a new stock position to user's portfolio.
        
        Args:
            user_id: User's UUID
            ticker: Stock ticker symbol
            volume: Number of shares
            avg_buy_price: Average purchase price
            
        Returns:
            Created position with calculations
            
        Raises:
            ValueError: If position already exists
        """
        logger.info(f"Adding position: {ticker} for user: {user_id}")
        
        # Check if position already exists
        existing = await self.portfolio_repo.find_by_user_and_ticker(user_id, ticker)
        if existing:
            raise ValueError(f"Position for {ticker} already exists. Use update instead.")
        
        # Create new position
        data = {
            "user_id": user_id,
            "ticker": ticker.upper(),
            "volume": int(volume),  # Convert to int for database
            "avg_buy_price": avg_buy_price
        }
        
        created = await self.portfolio_repo.create(data)
        
        # Calculate market value
        market_value = volume * avg_buy_price
        
        return {
            **created,
            "market_value": market_value,
            "allocation_percent": 100  # First position = 100%
        }
    
    async def update_position(
        self, 
        portfolio_id: str, 
        user_id: str,
        data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Update an existing position.
        
        Args:
            portfolio_id: Portfolio UUID
            user_id: User's UUID (for verification)
            data: Fields to update (volume, avg_buy_price)
            
        Returns:
            Updated position
            
        Raises:
            ValueError: If position not found or doesn't belong to user
        """
        logger.info(f"Updating position: {portfolio_id}")
        
        # Verify position exists and belongs to user
        existing = await self.portfolio_repo.find_by_id(portfolio_id)
        if not existing:
            raise ValueError("Position not found")
        
        if existing.get("user_id") != user_id:
            raise ValueError("Position does not belong to this user")
        
        # Filter only allowed fields
        update_data = {}
        if "volume" in data and data["volume"] is not None:
            update_data["volume"] = int(data["volume"])  # Convert to int
        if "avg_buy_price" in data and data["avg_buy_price"] is not None:
            update_data["avg_buy_price"] = data["avg_buy_price"]
        
        if not update_data:
            raise ValueError("No valid fields to update")
        
        updated = await self.portfolio_repo.update(portfolio_id, update_data)
        
        # Calculate market value
        volume = updated.get("volume", 0) or 0
        price = updated.get("avg_buy_price", 0) or 0
        market_value = volume * price
        
        return {
            **updated,
            "market_value": market_value,
            "allocation_percent": 0  # Will be recalculated
        }
    
    async def remove_position(
        self, 
        portfolio_id: str, 
        user_id: str
    ) -> Dict[str, Any]:
        """
        Remove a position from portfolio.
        
        Args:
            portfolio_id: Portfolio UUID
            user_id: User's UUID (for verification)
            
        Returns:
            Dict with success message
            
        Raises:
            ValueError: If position not found or doesn't belong to user
        """
        logger.info(f"Removing position: {portfolio_id}")
        
        # Verify position exists and belongs to user
        existing = await self.portfolio_repo.find_by_id(portfolio_id)
        if not existing:
            raise ValueError("Position not found")
        
        if existing.get("user_id") != user_id:
            raise ValueError("Position does not belong to this user")
        
        success = await self.portfolio_repo.delete(portfolio_id)
        
        if not success:
            raise ValueError("Failed to delete position")
        
        return {
            "message": f"Position {existing.get('ticker')} removed successfully",
            "deleted_id": portfolio_id
        }
