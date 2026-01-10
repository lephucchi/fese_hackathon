"""
Portfolio Routes - HTTP endpoints for portfolio management.

Flow: Routes (thin) → Services (thick) → Repositories → Database
"""
import logging
from fastapi import APIRouter, HTTPException, Depends

from ..schemas.requests.portfolio import CreatePortfolioRequest, UpdatePortfolioRequest
from ..schemas.responses.portfolio import (
    PortfolioListResponse,
    PortfolioDetailResponse,
    PortfolioDeleteResponse,
    PortfolioItem
)
from ..services.portfolio_service import PortfolioService
from ..repositories.portfolio_repository import PortfolioRepository
from ..dependencies import get_supabase_client
from ..middleware.auth import get_current_user_id

logger = logging.getLogger(__name__)

router = APIRouter(tags=["Portfolio"], prefix="/portfolio")


# =========================================================================
# Dependencies
# =========================================================================

def get_portfolio_repository(supabase=Depends(get_supabase_client)) -> PortfolioRepository:
    """Dependency to get PortfolioRepository instance."""
    return PortfolioRepository(supabase)


def get_portfolio_service(
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository)
) -> PortfolioService:
    """Dependency to get PortfolioService instance."""
    return PortfolioService(portfolio_repo)


# =========================================================================
# Endpoints
# =========================================================================

@router.get(
    "",
    response_model=PortfolioListResponse,
    summary="Get user's portfolio",
    description="""
    Get all stock positions in user's portfolio.
    
    - Returns empty list with has_portfolio=false if no positions exist
    - Calculates market_value and allocation_percent for each position
    - Requires authentication via JWT token
    """
)
async def get_portfolio(
    user_id: str = Depends(get_current_user_id),
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """Get user's portfolio with all positions."""
    try:
        result = await portfolio_service.get_user_portfolio(user_id)
        
        items = [
            PortfolioItem(
                portfolio_id=item["portfolio_id"],
                ticker=item["ticker"],
                volume=item["volume"],
                avg_buy_price=item["avg_buy_price"],
                market_value=item["market_value"],
                allocation_percent=item["allocation_percent"],
                updated_at=item.get("updated_at")
            )
            for item in result["items"]
        ]
        
        return PortfolioListResponse(
            has_portfolio=result["has_portfolio"],
            items=items,
            total_value=result["total_value"],
            position_count=result["position_count"]
        )
        
    except Exception as e:
        logger.error(f"Error fetching portfolio: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "fetch_error", "message": str(e)}
        )


@router.post(
    "",
    response_model=PortfolioDetailResponse,
    status_code=201,
    summary="Add new position",
    description="""
    Add a new stock position to portfolio.
    
    - ticker: Stock symbol (e.g., VCB, HPG)
    - volume: Number of shares
    - avg_buy_price: Average purchase price per share
    
    Returns error if position for this ticker already exists.
    Requires authentication via JWT token.
    """
)
async def add_position(
    request: CreatePortfolioRequest,
    user_id: str = Depends(get_current_user_id),
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """Add a new stock position."""
    try:
        result = await portfolio_service.add_position(
            user_id=user_id,
            ticker=request.ticker,
            volume=request.volume,
            avg_buy_price=request.avg_buy_price
        )
        
        item = PortfolioItem(
            portfolio_id=result["portfolio_id"],
            ticker=result["ticker"],
            volume=result["volume"],
            avg_buy_price=result["avg_buy_price"],
            market_value=result["market_value"],
            allocation_percent=result["allocation_percent"],
            updated_at=result.get("updated_at")
        )
        
        return PortfolioDetailResponse(
            message=f"Position {request.ticker} added successfully",
            item=item
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "validation_error", "message": str(e)}
        )
    except Exception as e:
        logger.error(f"Error adding position: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "create_error", "message": str(e)}
        )


@router.put(
    "/{portfolio_id}",
    response_model=PortfolioDetailResponse,
    summary="Update position",
    description="""
    Update an existing stock position.
    
    - volume: New quantity (optional)
    - avg_buy_price: New average price (optional)
    
    Requires authentication via JWT token.
    """
)
async def update_position(
    portfolio_id: str,
    request: UpdatePortfolioRequest,
    user_id: str = Depends(get_current_user_id),
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """Update an existing position."""
    try:
        result = await portfolio_service.update_position(
            portfolio_id=portfolio_id,
            user_id=user_id,
            data=request.model_dump(exclude_none=True)
        )
        
        item = PortfolioItem(
            portfolio_id=result["portfolio_id"],
            ticker=result["ticker"],
            volume=result["volume"],
            avg_buy_price=result["avg_buy_price"],
            market_value=result["market_value"],
            allocation_percent=result["allocation_percent"],
            updated_at=result.get("updated_at")
        )
        
        return PortfolioDetailResponse(
            message=f"Position {result['ticker']} updated successfully",
            item=item
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "validation_error", "message": str(e)}
        )
    except Exception as e:
        logger.error(f"Error updating position: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "update_error", "message": str(e)}
        )


@router.delete(
    "/{portfolio_id}",
    response_model=PortfolioDeleteResponse,
    summary="Delete position",
    description="Remove a stock position from portfolio. Requires authentication."
)
async def delete_position(
    portfolio_id: str,
    user_id: str = Depends(get_current_user_id),
    portfolio_service: PortfolioService = Depends(get_portfolio_service)
):
    """Delete a position from portfolio."""
    try:
        result = await portfolio_service.remove_position(
            portfolio_id=portfolio_id,
            user_id=user_id
        )
        
        return PortfolioDeleteResponse(
            message=result["message"],
            deleted_id=result["deleted_id"]
        )
        
    except ValueError as e:
        raise HTTPException(
            status_code=400,
            detail={"error": "validation_error", "message": str(e)}
        )
    except Exception as e:
        logger.error(f"Error deleting position: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"error": "delete_error", "message": str(e)}
        )
