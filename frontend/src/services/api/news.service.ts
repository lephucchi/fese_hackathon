/**
 * News Service
 * API operations for /api/news endpoint
 */

import { API_BASE_URL } from '@/utils/constants';

export interface TickerInfo {
    ticker: string;
    confidence: number | null;
}

export interface NewsItem {
    news_id: string;
    title: string;
    content: string | null;
    source_url: string | null;
    published_at: string | null;
    sentiment: 'positive' | 'negative' | 'neutral' | null;
    analyst: Record<string, unknown> | null;
    tickers: TickerInfo[];
}

export interface NewsListResponse {
    news: NewsItem[];
    total: number;
    page: number;
    page_size: number;
    has_next: boolean;
}

export interface NewsStatsResponse {
    total_news: number;
    sentiment_stats: {
        positive: number;
        negative: number;
        neutral: number;
        total: number;
    };
    top_tickers: { ticker: string; count: number }[];
    latest_crawl_at: string | null;
}

export const newsService = {
    /**
     * Fetch paginated news list
     */
    async getNewsList(
        page: number = 1,
        pageSize: number = 10,
        sentiment?: string
    ): Promise<NewsListResponse> {
        let url = `${API_BASE_URL}/api/news?page=${page}&page_size=${pageSize}`;

        if (sentiment) {
            url += `&sentiment=${sentiment}`;
        }

        const response = await fetch(url, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Không thể tải tin tức');
        }

        return response.json();
    },

    /**
     * Fetch news by ID
     */
    async getNewsById(newsId: string): Promise<{ news: NewsItem; related_news: NewsItem[] }> {
        const response = await fetch(`${API_BASE_URL}/api/news/${newsId}`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Không thể tải chi tiết tin tức');
        }

        return response.json();
    },

    /**
     * Fetch news statistics
     */
    async getNewsStats(): Promise<NewsStatsResponse> {
        const response = await fetch(`${API_BASE_URL}/api/news/stats`, {
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Không thể tải thống kê tin tức');
        }

        return response.json();
    },

    /**
     * Fetch news by ticker
     */
    async getNewsByTicker(
        ticker: string,
        page: number = 1,
        pageSize: number = 10
    ): Promise<{
        ticker: string;
        news: NewsItem[];
        total: number;
        sentiment_summary: Record<string, number> | null;
    }> {
        const response = await fetch(
            `${API_BASE_URL}/api/news/ticker/${ticker}?page=${page}&page_size=${pageSize}`,
            {
                credentials: 'include',
            }
        );

        if (!response.ok) {
            throw new Error(`Không thể tải tin tức cho mã ${ticker}`);
        }

        return response.json();
    },

    /**
     * Fetch unread news for authenticated user (server-filtered)
     */
    async getUnreadNews(
        page: number = 1,
        pageSize: number = 20
    ): Promise<NewsListResponse> {
        const response = await fetch(
            `${API_BASE_URL}/api/news/for-user?page=${page}&page_size=${pageSize}`,
            {
                credentials: 'include',
            }
        );

        if (!response.ok) {
            if (response.status === 401) {
                throw new Error('Vui lòng đăng nhập để xem tin tức');
            }
            throw new Error('Không thể tải tin tức chưa đọc');
        }

        return response.json();
    },
};
