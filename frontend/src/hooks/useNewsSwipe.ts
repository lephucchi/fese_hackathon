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
    const [allNews, setAllNews] = useState<NewsSwipeItem[]>([]);
    const [stack, setStack] = useState<NewsSwipeItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [savedCount, setSavedCount] = useState(0);
    const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
    const [total, setTotal] = useState(0);

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            // Fetch news from /api/news
            const response = await newsService.getNewsList(1, pageSize);

            const swipeItems = response.news.map(convertToSwipeItem);
            setAllNews(swipeItems);
            setTotal(response.total);

            // Filter out already swiped items
            const unswipedItems = swipeItems.filter(item => !swipedIds.has(item.news_id));
            setStack(unswipedItems);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
            console.error('Error fetching news:', err);
        } finally {
            setLoading(false);
        }
    }, [pageSize, swipedIds]);

    // Fetch on mount
    useEffect(() => {
        fetchNews();
    }, []);

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
        // Reset swiped IDs for fresh start
        setSwipedIds(new Set());
        setSavedCount(0);
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
