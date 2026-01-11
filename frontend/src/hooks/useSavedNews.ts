'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '@/utils/constants/api';

export interface SavedNewsItem {
    news_id: string;
    title: string;
    content: string | null;
    source_url: string | null;
    published_at: string | null;
    sentiment: string | null;
    analyst: Record<string, unknown> | null;
    tickers: { ticker: string; confidence: number | null }[];
}

interface UseSavedNewsReturn {
    savedNews: SavedNewsItem[];
    loading: boolean;
    error: string | null;
    total: number;
    hasAnalysis: number;
    missingAnalysis: number;
    refetch: () => Promise<void>;
    addOptimisticNews: (news: SavedNewsItem) => void;
    removeOptimisticNews: (newsId: string) => void;
    deleteSavedNews: (newsId: string) => Promise<boolean>;
    deleting: string | null;
}

// Helper function to deduplicate news by news_id
const deduplicateNews = (newsList: SavedNewsItem[]): SavedNewsItem[] => {
    const seen = new Set<string>();
    return newsList.filter(news => {
        if (seen.has(news.news_id)) {
            return false;
        }
        seen.add(news.news_id);
        return true;
    });
};

export function useSavedNews(): UseSavedNewsReturn {
    const { user, isAuthenticated } = useAuth();
    const [savedNews, setSavedNews] = useState<SavedNewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasAnalysis, setHasAnalysis] = useState(0);
    const [missingAnalysis, setMissingAnalysis] = useState(0);

    // Calculate total from actual unique items
    const total = savedNews.length;

    const fetchSavedNews = useCallback(async () => {
        if (!user || !isAuthenticated) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/interactions/my-interests`, {
                headers: {
                    'x-user-id': user.user_id,
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Không thể tải tin tức đã lưu');
            }

            const data = await response.json();

            // Deduplicate the API response
            const uniqueNews = deduplicateNews(data.news || []);
            setSavedNews(uniqueNews);
            setHasAnalysis(data.has_analysis || 0);
            setMissingAnalysis(data.missing_analysis || 0);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
            console.error('Error fetching saved news:', err);
        } finally {
            setLoading(false);
        }
    }, [user, isAuthenticated]);

    // Fetch on mount and when auth changes
    useEffect(() => {
        if (isAuthenticated) {
            fetchSavedNews();
        }
    }, [isAuthenticated, fetchSavedNews]);

    // Optimistic add - add news immediately without waiting for API
    const addOptimisticNews = useCallback((news: SavedNewsItem) => {
        setSavedNews(prev => {
            // Check if already exists by news_id
            const exists = prev.some(n => n.news_id === news.news_id);
            if (exists) {
                console.log(`News ${news.news_id} already in saved list, skipping`);
                return prev; // Don't add duplicate
            }
            // Add to beginning of list
            return [news, ...prev];
        });
    }, []);

    // Optimistic remove
    const removeOptimisticNews = useCallback((newsId: string) => {
        setSavedNews(prev => prev.filter(n => n.news_id !== newsId));
    }, []);

    // Track which news is being deleted
    const [deleting, setDeleting] = useState<string | null>(null);

    // Delete saved news with API call
    const deleteSavedNews = useCallback(async (newsId: string): Promise<boolean> => {
        if (!user || !isAuthenticated) {
            return false;
        }

        // Store the item before removing (for rollback)
        const itemToDelete = savedNews.find(n => n.news_id === newsId);
        if (!itemToDelete) return false;

        // Optimistic remove
        setDeleting(newsId);
        setSavedNews(prev => prev.filter(n => n.news_id !== newsId));

        try {
            const response = await fetch(`${API_BASE_URL}/api/interactions/${newsId}`, {
                method: 'DELETE',
                credentials: 'include',
            });

            if (!response.ok) {
                // Rollback on failure
                setSavedNews(prev => [itemToDelete, ...prev]);
                console.error('Failed to delete saved news');
                return false;
            }

            console.log(`Successfully deleted saved news: ${newsId}`);
            return true;
        } catch (err) {
            // Rollback on error
            setSavedNews(prev => [itemToDelete, ...prev]);
            console.error('Error deleting saved news:', err);
            return false;
        } finally {
            setDeleting(null);
        }
    }, [user, isAuthenticated, savedNews]);

    return {
        savedNews,
        loading,
        error,
        total,
        hasAnalysis,
        missingAnalysis,
        refetch: fetchSavedNews,
        addOptimisticNews,
        removeOptimisticNews,
        deleteSavedNews,
        deleting,
    };
}
