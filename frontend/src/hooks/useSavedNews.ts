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
}

export function useSavedNews(): UseSavedNewsReturn {
    const { user, isAuthenticated } = useAuth();
    const [savedNews, setSavedNews] = useState<SavedNewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [total, setTotal] = useState(0);
    const [hasAnalysis, setHasAnalysis] = useState(0);
    const [missingAnalysis, setMissingAnalysis] = useState(0);

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
            setSavedNews(data.news || []);
            setTotal(data.total || 0);
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
            // Check if already exists
            if (prev.some(n => n.news_id === news.news_id)) {
                return prev;
            }
            return [news, ...prev];
        });
        setTotal(prev => prev + 1);
    }, []);

    // Optimistic remove
    const removeOptimisticNews = useCallback((newsId: string) => {
        setSavedNews(prev => prev.filter(n => n.news_id !== newsId));
        setTotal(prev => Math.max(0, prev - 1));
    }, []);

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
    };
}
