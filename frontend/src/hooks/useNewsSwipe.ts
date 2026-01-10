'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { newsService, NewsItem } from '@/services/api/news.service';
import { API_BASE_URL } from '@/utils/constants/api';

export interface NewsSwipeItem {
    news_id: string;
    title: string;
    content: string | null;
    sentiment: string | null;
    sentiment_color: string;
    keywords: string[];
    tickers: string[];
    published_at: string | null;
    source_url: string | null;
}

interface UseNewsSwipeReturn {
    stack: NewsSwipeItem[];
    loading: boolean;
    error: string | null;
    remaining: number;
    swipeRight: (newsId: string) => Promise<void>;
    swipeLeft: (newsId: string) => Promise<void>;
    refetch: () => Promise<void>;
    savedCount: number;
    total: number;
}

// Storage keys
const STORAGE_KEYS = {
    STACK: 'news_swipe_stack',
    SWIPED_IDS: 'news_swipe_swiped_ids',
    SAVED_COUNT: 'news_swipe_saved_count',
    TOTAL: 'news_swipe_total',
    FETCHED: 'news_swipe_fetched',
};

// Helper to safely access sessionStorage (SSR safe)
const getSessionItem = <T>(key: string, defaultValue: T): T => {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = sessionStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
};

const setSessionItem = <T>(key: string, value: T): void => {
    if (typeof window === 'undefined') return;
    try {
        sessionStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Error saving to sessionStorage:', e);
    }
};

// Sentiment color mapping
const getSentimentColor = (sentiment: string | null): string => {
    const s = sentiment?.toLowerCase();
    switch (s) {
        case 'positive':
            return '#2ECC71';
        case 'negative':
            return '#E74C3C';
        default:
            return '#F39C12';
    }
};

// Extract keywords from analyst data
const extractKeywords = (analyst: Record<string, unknown> | null): string[] => {
    if (!analyst) return [];
    const keywords = analyst.keywords as string[] | undefined;
    return keywords?.slice(0, 5) || [];
};

// Convert NewsItem to NewsSwipeItem
const convertToSwipeItem = (news: NewsItem): NewsSwipeItem => ({
    news_id: news.news_id,
    title: news.title,
    content: news.content,
    sentiment: news.sentiment,
    sentiment_color: getSentimentColor(news.sentiment),
    keywords: extractKeywords(news.analyst),
    tickers: news.tickers.map(t => t.ticker),
    published_at: news.published_at,
    source_url: news.source_url,
});

export function useNewsSwipe(pageSize: number = 20): UseNewsSwipeReturn {
    const { user, isAuthenticated } = useAuth();

    // Initialize state from sessionStorage
    const [stack, setStack] = useState<NewsSwipeItem[]>(() =>
        getSessionItem(STORAGE_KEYS.STACK, [])
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedCount, setSavedCount] = useState(() =>
        getSessionItem(STORAGE_KEYS.SAVED_COUNT, 0)
    );
    const [swipedIds, setSwipedIds] = useState<Set<string>>(() =>
        new Set(getSessionItem<string[]>(STORAGE_KEYS.SWIPED_IDS, []))
    );
    const [total, setTotal] = useState(() =>
        getSessionItem(STORAGE_KEYS.TOTAL, 0)
    );
    const [hasFetched, setHasFetched] = useState(() =>
        getSessionItem(STORAGE_KEYS.FETCHED, false)
    );

    // Persist stack to sessionStorage whenever it changes
    useEffect(() => {
        setSessionItem(STORAGE_KEYS.STACK, stack);
    }, [stack]);

    // Persist swipedIds to sessionStorage
    useEffect(() => {
        setSessionItem(STORAGE_KEYS.SWIPED_IDS, Array.from(swipedIds));
    }, [swipedIds]);

    // Persist savedCount
    useEffect(() => {
        setSessionItem(STORAGE_KEYS.SAVED_COUNT, savedCount);
    }, [savedCount]);

    // Persist total
    useEffect(() => {
        setSessionItem(STORAGE_KEYS.TOTAL, total);
    }, [total]);

    // Persist fetched flag
    useEffect(() => {
        setSessionItem(STORAGE_KEYS.FETCHED, hasFetched);
    }, [hasFetched]);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch news from /api/news
            const response = await newsService.getNewsList(1, pageSize);

            const swipeItems = response.news.map(convertToSwipeItem);
            setTotal(response.total);

            // Filter out already swiped items
            const currentSwipedIds = getSessionItem<string[]>(STORAGE_KEYS.SWIPED_IDS, []);
            const swipedSet = new Set(currentSwipedIds);
            const unswipedItems = swipeItems.filter(item => !swipedSet.has(item.news_id));
            setStack(unswipedItems);
            setHasFetched(true);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
            console.error('Error fetching news:', err);
        } finally {
            setLoading(false);
        }
    }, [pageSize]);

    // Fetch only if not already fetched
    useEffect(() => {
        if (!hasFetched && stack.length === 0) {
            fetchNews();
        }
    }, [hasFetched, stack.length, fetchNews]);

    // Record interaction to backend
    const recordInteraction = async (newsId: string, actionType: 'SWIPE_RIGHT' | 'SWIPE_LEFT') => {
        if (!user || !isAuthenticated) return;

        try {
            await fetch(`${API_BASE_URL}/api/interactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': user.user_id,
                },
                credentials: 'include',
                body: JSON.stringify({
                    news_id: newsId,
                    action_type: actionType,
                }),
            });
        } catch (err) {
            console.error('Error recording interaction:', err);
        }
    };

    const swipeRight = useCallback(async (newsId: string) => {
        // Record interaction
        await recordInteraction(newsId, 'SWIPE_RIGHT');

        // Update local state
        setSwipedIds(prev => new Set(prev).add(newsId));
        setStack(prev => prev.filter(item => item.news_id !== newsId));
        setSavedCount(prev => prev + 1);
    }, [user, isAuthenticated]);

    const swipeLeft = useCallback(async (newsId: string) => {
        // Record interaction
        await recordInteraction(newsId, 'SWIPE_LEFT');

        // Update local state
        setSwipedIds(prev => new Set(prev).add(newsId));
        setStack(prev => prev.filter(item => item.news_id !== newsId));
    }, [user, isAuthenticated]);

    const refetch = useCallback(async () => {
        // Clear sessionStorage for fresh start
        sessionStorage.removeItem(STORAGE_KEYS.STACK);
        sessionStorage.removeItem(STORAGE_KEYS.SWIPED_IDS);
        sessionStorage.removeItem(STORAGE_KEYS.SAVED_COUNT);
        sessionStorage.removeItem(STORAGE_KEYS.FETCHED);

        // Reset state
        setSwipedIds(new Set());
        setSavedCount(0);
        setHasFetched(false);

        // Fetch fresh data
        await fetchNews();
    }, [fetchNews]);

    return {
        stack,
        loading,
        error,
        remaining: stack.length,
        swipeRight,
        swipeLeft,
        refetch,
        savedCount,
        total,
    };
}
