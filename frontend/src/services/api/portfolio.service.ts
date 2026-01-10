/**
 * Portfolio Service - API calls for portfolio management
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface PortfolioItem {
    portfolio_id: string;
    ticker: string;
    volume: number;
    avg_buy_price: number;
    market_value: number;
    allocation_percent: number;
    updated_at?: string;
}

export interface PortfolioResponse {
    has_portfolio: boolean;
    items: PortfolioItem[];
    total_value: number;
    position_count: number;
}

export interface CreatePositionData {
    ticker: string;
    volume: number;
    avg_buy_price: number;
}

export interface UpdatePositionData {
    volume?: number;
    avg_buy_price?: number;
}

/**
 * Get user's portfolio
 */
export async function getPortfolio(): Promise<PortfolioResponse> {
    const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
        method: 'GET',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Failed to fetch portfolio');
    }

    return response.json();
}

/**
 * Add new position
 */
export async function addPosition(data: CreatePositionData): Promise<PortfolioItem> {
    const response = await fetch(`${API_BASE_URL}/api/portfolio`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Failed to add position');
    }

    const result = await response.json();
    return result.item;
}

/**
 * Update existing position
 */
export async function updatePosition(
    portfolioId: string,
    data: UpdatePositionData
): Promise<PortfolioItem> {
    const response = await fetch(`${API_BASE_URL}/api/portfolio/${portfolioId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Failed to update position');
    }

    const result = await response.json();
    return result.item;
}

/**
 * Delete position
 */
export async function deletePosition(portfolioId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/portfolio/${portfolioId}`, {
        method: 'DELETE',
        credentials: 'include',
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail?.message || 'Failed to delete position');
    }
}
