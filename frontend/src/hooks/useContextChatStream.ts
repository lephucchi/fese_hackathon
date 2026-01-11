'use client';

import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { API_BASE_URL } from '@/utils/constants/api';

export interface ThinkingStep {
  type: 'thinking' | 'answer_chunk' | 'answer_start' | 'complete' | 'error';
  step?: string;
  status?: 'running' | 'done';
  message?: string;
  content?: string;
  count?: number;
  elapsed_ms?: number;
  message_id?: string;
  total_time_ms?: number;
  citations?: Citation[];
  data?: {
    routes?: string[];
    sub_queries?: string[];
    doc_count?: number;
    fact_count?: number;
    needs_fallback?: boolean;
    portfolio_tickers?: string[];
    context_count?: number;
  };
}

export interface Citation {
  number: number;
  source: string;
  preview: string;
  similarity?: number;
}

interface UseContextChatStreamReturn {
  sendStreamingQuery: (query: string) => Promise<void>;
  sendGenericQuery: (query: string) => Promise<string>;
  isStreaming: boolean;
  thinkingSteps: ThinkingStep[];
  answer: string;
  citations: Citation[];
  contextInfo: {
    cached: boolean;
    context_used: number;
  };
  totalTimeMs: number;
}

export function useContextChatStream(): UseContextChatStreamReturn {
  const { user } = useAuth();
  const [isStreaming, setIsStreaming] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<ThinkingStep[]>([]);
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState<Citation[]>([]);
  const [contextInfo, setContextInfo] = useState({ cached: false, context_used: 0 });
  const [totalTimeMs, setTotalTimeMs] = useState(0);

  const sendStreamingQuery = useCallback(async (query: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setIsStreaming(true);
    setThinkingSteps([]);
    setAnswer('');
    setCitations([]);
    setContextInfo({ cached: false, context_used: 0 });
    setTotalTimeMs(0);

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
      let receivedComplete = false;

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Process any remaining data in buffer before breaking
          if (buffer.trim()) {
            const remainingLines = buffer.split('\n');
            for (const line of remainingLines) {
              if (line.startsWith('data: ')) {
                try {
                  const data: ThinkingStep = JSON.parse(line.slice(6));
                  if (data.type === 'complete') {
                    receivedComplete = true;
                    setIsStreaming(false);
                    if (data.total_time_ms) {
                      setTotalTimeMs(data.total_time_ms);
                    }
                    if (data.citations) {
                      setCitations(data.citations);
                    }
                  } else if (data.type === 'answer_chunk') {
                    setAnswer((prev) => prev + (data.content || ''));
                  } else if (data.type === 'error') {
                    throw new Error(data.message || 'Unknown error');
                  }
                } catch (parseError) {
                  console.error('Failed to parse remaining SSE data:', parseError);
                }
              }
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data: ThinkingStep = JSON.parse(line.slice(6));

              if (data.type === 'thinking') {
                // Update or add thinking step
                setThinkingSteps((prev) => {
                  const existingIndex = prev.findIndex(
                    (s) => s.step === data.step && s.status === 'running'
                  );
                  
                  if (existingIndex >= 0 && data.status === 'done') {
                    // Update existing running step to done
                    const updated = [...prev];
                    updated[existingIndex] = data;
                    return updated;
                  } else if (data.status === 'running') {
                    // Add new running step
                    return [...prev, data];
                  } else {
                    // Add done step (no matching running step)
                    return [...prev, data];
                  }
                });
                
                if (data.data?.doc_count !== undefined) {
                  setContextInfo((prev) => ({ ...prev, context_used: data.data?.doc_count || 0 }));
                }
              } else if (data.type === 'answer_start') {
                // Keep thinking steps visible, just start building answer
              } else if (data.type === 'answer_chunk') {
                setAnswer((prev) => prev + (data.content || ''));
              } else if (data.type === 'complete') {
                receivedComplete = true;
                setIsStreaming(false);
                if (data.total_time_ms) {
                  setTotalTimeMs(data.total_time_ms);
                }
                if (data.citations) {
                  setCitations(data.citations);
                }
              } else if (data.type === 'error') {
                throw new Error(data.message || 'Unknown error');
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        }
      }
      
      // If stream ended without receiving complete event, it's an error
      if (!receivedComplete) {
        console.warn('Stream ended without complete event');
        // Don't throw error - just mark as done, answer should be visible
        setIsStreaming(false);
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
    citations,
    contextInfo,
    totalTimeMs,
  };
}
