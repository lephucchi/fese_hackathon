/**
 * Market Service
 * Market/News stack API operations
 */

import { API_ENDPOINTS, API_BASE_URL } from '@/utils/constants';

export interface NewsStackItem {
    news_id: string;
    title: string;
    sentiment: string | null;
    sentiment_color: string;
    keywords: string[];
    tickers: string[];
    published_at: string | null;
}

export interface NewsStackResponse {
    stack: NewsStackItem[];
    remaining: number;
}

export interface InteractionResponse {
    success: boolean;
    message?: string;
}

export const marketService = {
    /**
     * Fetch news stack for user
     */
    async fetchStack(userId: string, limit: number = 20): Promise<NewsStackResponse> {
        const response = await fetch(
            `${API_BASE_URL}${API_ENDPOINTS.MARKET.STACK}?limit=${limit}`,
            {
                headers: {
                    'x-user-id': userId,
                },
                credentials: 'include',
            }
        );

        if (!response.ok) {
            throw new Error('Không thể tải tin tức');
        }

        return response.json();
    },

    /**
     * Record user interaction with news
     */
    async recordInteraction(
        userId: string,
        newsId: string,
        actionType: 'approve' | 'reject'
    ): Promise<InteractionResponse> {
        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.MARKET.INTERACTIONS}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-id': userId,
            },
            credentials: 'include',
            body: JSON.stringify({
                news_id: newsId,
                action_type: actionType,
            }),
        });

        if (!response.ok) {
            throw new Error('Không thể lưu tương tác');
        }

        return response.json();
    },
};
