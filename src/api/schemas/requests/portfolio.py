"""
Portfolio Request Schemas - Input validation for Portfolio API.
"""
from typing import Optional
from pydantic import BaseModel, Field


class CreatePortfolioRequest(BaseModel):
    """Request to add a new stock position."""
    ticker: str = Field(
        ..., 
        min_length=1, 
        max_length=10,
        description="Stock ticker symbol (e.g., VCB, HPG)"
    )
    volume: float = Field(
        ..., 
        gt=0,
        description="Number of shares"
    )
    avg_buy_price: float = Field(
        ..., 
        gt=0,
        description="Average purchase price per share"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "ticker": "VCB",
                "volume": 1000,
                "avg_buy_price": 65000
            }
        }


class UpdatePortfolioRequest(BaseModel):
    """Request to update an existing position."""
    volume: Optional[float] = Field(
        None, 
        gt=0,
        description="New quantity"
    )
    avg_buy_price: Optional[float] = Field(
        None, 
        gt=0,
        description="New average price"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "volume": 1500,
                "avg_buy_price": 68000
            }
        }
