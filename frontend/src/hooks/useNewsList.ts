'use client';

import { useState, useEffect, useCallback } from 'react';
import { newsService, NewsItem, NewsListResponse } from '@/services/api/news.service';

interface UseNewsListOptions {
    pageSize?: number;
    sentiment?: string;
    autoFetch?: boolean;
}

interface UseNewsListReturn {
    news: NewsItem[];
    loading: boolean;
    error: string | null;
    page: number;
    totalPages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
    nextPage: () => void;
    prevPage: () => void;
    goToPage: (page: number) => void;
    refetch: () => Promise<void>;
    setSentimentFilter: (sentiment: string | undefined) => void;
}

export function useNewsList(options: UseNewsListOptions = {}): UseNewsListReturn {
    const { pageSize = 10, sentiment: initialSentiment, autoFetch = true } = options;

    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [hasNext, setHasNext] = useState(false);
    const [sentiment, setSentiment] = useState<string | undefined>(initialSentiment);

    const totalPages = Math.ceil(total / pageSize);
    const hasPrev = page > 1;

    const fetchNews = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await newsService.getNewsList(page, pageSize, sentiment);
            setNews(response.news);
            setTotal(response.total);
            setHasNext(response.has_next);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
            console.error('Error fetching news:', err);
        } finally {
            setLoading(false);
        }
    }, [page, pageSize, sentiment]);

    useEffect(() => {
        if (autoFetch) {
            fetchNews();
        }
    }, [fetchNews, autoFetch]);

    const nextPage = useCallback(() => {
        if (hasNext) {
            setPage(p => p + 1);
        }
    }, [hasNext]);

    const prevPage = useCallback(() => {
        if (hasPrev) {
            setPage(p => p - 1);
        }
    }, [hasPrev]);

    const goToPage = useCallback((newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setPage(newPage);
        }
    }, [totalPages]);

    const setSentimentFilter = useCallback((newSentiment: string | undefined) => {
        setSentiment(newSentiment);
        setPage(1); // Reset to first page when filter changes
    }, []);

    return {
        news,
        loading,
        error,
        page,
        totalPages,
        total,
        hasNext,
        hasPrev,
        nextPage,
        prevPage,
        goToPage,
        refetch: fetchNews,
        setSentimentFilter,
    };
}
