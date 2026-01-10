'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ThinkingStep {
  type: 'thinking' | 'answer_chunk' | 'answer_start' | 'complete' | 'error';
  step?: string;
  message?: string;
  content?: string;
  count?: number;
  message_id?: string;
}

interface UseContextChatStreamReturn {
  sendStreamingQuery: (query: string) => Promise<void>;
  sendGenericQuery: (query: string) => Promise<string>;
  isStreaming: boolean;
  thinkingSteps: ThinkingStep[];
  answer: string;
  contextInfo: {
    cached: boolean;
    context_used: number;
  };
}

export function useContextChatStream(): UseContextChatStreamReturn {
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [answer, setAnswer] = useState('');
  const [contextInfo, setContextInfo] = useState({ cached: false, context_used: 0 });

  const sendStreamingQuery = useCallback(async (query: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsStreaming(true);
    setThinkingSteps([]);
    setAnswer('');
    setContextInfo({ cached: false, context_used: 0 });

    try {
      const response = await fetch(`${API_BASE_URL}/api/market/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.user_id,
        },
        credentials: 'include',
        body: JSON.stringify({
          query,
          use_interests: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Stream failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: ThinkingStep = JSON.parse(line.slice(6));

              if (data.type === 'thinking') {
                setThinkingSteps((prev) => [...prev, data]);
                if (data.count !== undefined) {
                  setContextInfo((prev) => ({ ...prev, context_used: data.count || 0 }));
                }
              } else if (data.type === 'answer_start') {
                // Clear thinking steps when answer starts
                setThinkingSteps([]);
              } else if (data.type === 'answer_chunk') {
                setAnswer((prev) => prev + (data.content || ''));
              } else if (data.type === 'complete') {
                setIsStreaming(false);
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Unknown error');
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      setIsStreaming(false);
      throw error;
    }
  }, [user]);

  const sendGenericQuery = useCallback(async (query: string): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        throw new Error('Query failed');
      }

      const data = await response.json();
      return data.answer || '';
    } catch (error) {
      console.error('Generic query error:', error);
      throw error;
    }
  }, [user]);

  return {
    sendStreamingQuery,
    sendGenericQuery,
    isStreaming,
    thinkingSteps,
    answer,
    contextInfo,
  };
}
