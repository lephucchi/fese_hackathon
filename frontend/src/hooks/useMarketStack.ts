'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '@/utils/constants/api';

export interface NewsStackItem {
  news_id: string;
  title: string;
  content: string | null;
  sentiment: string | null;
  sentiment_color: string;
  keywords: string[];
  tickers: string[];
  published_at: string | null;
}

interface UseMarketStackReturn {
  stack: NewsStackItem[];
  loading: boolean;
  error: string | null;
  remaining: number;
  swipeRight: (newsId: string) => Promise<void>;
  swipeLeft: (newsId: string) => Promise<void>;
  refetch: () => Promise<void>;
  savedCount: number;
}

export function useMarketStack(limit: number = 20): UseMarketStackReturn {
  const { user, isAuthenticated } = useAuth();
  const [stack, setStack] = useState<NewsStackItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [savedCount, setSavedCount] = useState(0);

  const fetchStack = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setError('Vui lòng đăng nhập để xem tin tức');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/market/stack?limit=${limit}`,
        {
          headers: {
            'x-user-id': user.user_id,
          },
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error('Không thể tải tin tức');
      }

      const data = await response.json();
      setStack(data.stack || []);
      setRemaining(data.remaining || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
      console.error('Error fetching news stack:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user, limit]);

  // Fetch stack on mount
  useEffect(() => {
    fetchStack();
  }, [fetchStack]);

  const recordInteraction = async (newsId: string, actionType: 'approve' | 'reject') => {
    if (!user) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/interactions`, {
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

      if (!response.ok) {
        throw new Error('Không thể lưu tương tác');
      }

      return await response.json();
    } catch (err) {
      console.error('Error recording interaction:', err);
      throw err;
    }
  };

  const swipeRight = useCallback(async (newsId: string) => {
    try {
      // Record interaction
      await recordInteraction(newsId, 'approve');

      // Update local state
      setStack((prev) => prev.filter((item) => item.news_id !== newsId));
      setSavedCount((prev) => prev + 1);
      setRemaining((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError('Không thể lưu tin tức');
    }
  }, [user]);

  const swipeLeft = useCallback(async (newsId: string) => {
    try {
      // Record interaction
      await recordInteraction(newsId, 'reject');

      // Update local state
      setStack((prev) => prev.filter((item) => item.news_id !== newsId));
      setRemaining((prev) => Math.max(0, prev - 1));
    } catch (err) {
      setError('Không thể bỏ qua tin tức');
    }
  }, [user]);

  const refetch = useCallback(async () => {
    await fetchStack();
    setSavedCount(0); // Reset saved count when refetching
  }, [fetchStack]);

  return {
    stack,
    loading,
    error,
    remaining,
    swipeRight,
    swipeLeft,
    refetch,
    savedCount,
  };
}
