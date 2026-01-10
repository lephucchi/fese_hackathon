"""
Portfolio Response Schemas - Output formatting for Portfolio API.
"""
from typing import List, Optional
from pydantic import BaseModel, Field


class PortfolioItem(BaseModel):
    """Single portfolio position."""
    portfolio_id: str = Field(..., description="Unique ID")
    ticker: str = Field(..., description="Stock ticker")
    volume: float = Field(..., description="Number of shares")
    avg_buy_price: float = Field(..., description="Average purchase price")
    market_value: float = Field(..., description="volume * avg_buy_price")
    allocation_percent: float = Field(..., description="% of total portfolio")
    updated_at: Optional[str] = None


class PortfolioListResponse(BaseModel):
    """Response for GET /api/portfolio."""
    has_portfolio: bool = Field(..., description="Whether user has any positions")
    items: List[PortfolioItem] = Field(default_factory=list)
    total_value: float = Field(default=0, description="Sum of all market values")
    position_count: int = Field(default=0)


class PortfolioDetailResponse(BaseModel):
    """Response for single portfolio item."""
    message: str
    item: PortfolioItem


class PortfolioDeleteResponse(BaseModel):
    """Response for DELETE operation."""
    message: str
    deleted_id: str
