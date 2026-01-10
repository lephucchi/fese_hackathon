'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '@/utils/constants/api';

export interface UserInterest {
  news_id: string;
  title: string;
  sentiment: string | null;
  keywords: string[];
  tickers: string[];
  published_at: string | null;
  analyst?: any;
}

interface UseUserInterestsReturn {
  interests: UserInterest[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useUserInterests(): UseUserInterestsReturn {
  const { user, isAuthenticated } = useAuth();
  const [interests, setInterests] = useState<UserInterest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInterests = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setError('Vui lòng đăng nhập để xem tin tức quan tâm');
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
        throw new Error('Không thể tải tin tức quan tâm');
      }

      const data = await response.json();
      setInterests(data.news || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
      console.error('Error fetching user interests:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    fetchInterests();
  }, [fetchInterests]);

  return {
    interests,
    loading,
    error,
    refetch: fetchInterests,
  };
}
