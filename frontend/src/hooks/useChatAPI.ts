import { useState, useCallback } from 'react';
import { QueryResponse } from '@/types';
import { apiClient } from '@/services/api/client';

export function useChatAPI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendQuery = useCallback(async (query: string): Promise<QueryResponse | null> => {
    if (!query.trim()) return null;

    setIsLoading(true);
    setError(null);

    try {
      const data = await apiClient.post<QueryResponse>('/api/market/chat', {
        query: query.trim(),
        use_interests: true, // Enable context enrichment
      });
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred';
      setError(errorMessage);
      console.error('Query error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const checkHealth = useCallback(async () => {
    try {
      await apiClient.get('/api/health');
      return true;
    } catch {
      return false;
    }
  }, []);

  return {
    sendQuery,
    checkHealth,
    isLoading,
    error,
  };
}
