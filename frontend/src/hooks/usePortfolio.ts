/**
 * usePortfolio Hook - Manage portfolio state and operations
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    getPortfolio,
    addPosition,
    updatePosition,
    deletePosition,
    PortfolioItem,
    PortfolioResponse,
    CreatePositionData,
    UpdatePositionData,
} from '@/services/api/portfolio.service';

interface UsePortfolioReturn {
    // State
    portfolio: PortfolioResponse | null;
    isLoading: boolean;
    error: string | null;

    // Actions
    fetchPortfolio: () => Promise<void>;
    addNewPosition: (data: CreatePositionData) => Promise<PortfolioItem | null>;
    updateExistingPosition: (id: string, data: UpdatePositionData) => Promise<PortfolioItem | null>;
    removePosition: (id: string) => Promise<boolean>;
    clearError: () => void;
}

export function usePortfolio(): UsePortfolioReturn {
    const [portfolio, setPortfolio] = useState<PortfolioResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPortfolio = useCallback(async () => {
        try {
            setIsLoading(true);
            setError(null);
            const data = await getPortfolio();
            setPortfolio(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch portfolio');
            setPortfolio({
                has_portfolio: false,
                items: [],
                total_value: 0,
                position_count: 0,
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    const addNewPosition = useCallback(async (data: CreatePositionData): Promise<PortfolioItem | null> => {
        try {
            setError(null);
            const newItem = await addPosition(data);
            // Refresh portfolio to get updated allocations
            await fetchPortfolio();
            return newItem;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to add position');
            return null;
        }
    }, [fetchPortfolio]);

    const updateExistingPosition = useCallback(async (
        id: string,
        data: UpdatePositionData
    ): Promise<PortfolioItem | null> => {
        try {
            setError(null);
            const updatedItem = await updatePosition(id, data);
            // Refresh portfolio to get updated allocations
            await fetchPortfolio();
            return updatedItem;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update position');
            return null;
        }
    }, [fetchPortfolio]);

    const removePosition = useCallback(async (id: string): Promise<boolean> => {
        try {
            setError(null);
            await deletePosition(id);
            // Refresh portfolio
            await fetchPortfolio();
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete position');
            return false;
        }
    }, [fetchPortfolio]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    // Fetch on mount
    useEffect(() => {
        fetchPortfolio();
    }, [fetchPortfolio]);

    return {
        portfolio,
        isLoading,
        error,
        fetchPortfolio,
        addNewPosition,
        updateExistingPosition,
        removePosition,
        clearError,
    };
}
