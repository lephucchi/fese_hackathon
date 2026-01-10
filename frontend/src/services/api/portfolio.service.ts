/**
 * Portfolio Service - API calls for portfolio management
 */

import { apiClient } from './client';

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

interface PortfolioDetailResponse {
    message: string;
    item: PortfolioItem;
}

/**
 * Get user's portfolio
 */
export async function getPortfolio(): Promise<PortfolioResponse> {
    return apiClient.get<PortfolioResponse>('/api/portfolio');
}

/**
 * Add new position
 */
export async function addPosition(data: CreatePositionData): Promise<PortfolioItem> {
    const result = await apiClient.post<PortfolioDetailResponse>('/api/portfolio', data);
    return result.item;
}

/**
 * Update existing position
 */
export async function updatePosition(
    portfolioId: string,
    data: UpdatePositionData
): Promise<PortfolioItem> {
    const result = await apiClient.put<PortfolioDetailResponse>(`/api/portfolio/${portfolioId}`, data);
    return result.item;
}

/**
 * Delete position
 */
export async function deletePosition(portfolioId: string): Promise<void> {
    await apiClient.delete(`/api/portfolio/${portfolioId}`);
}
