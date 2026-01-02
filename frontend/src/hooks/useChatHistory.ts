'use client';

import { useState, useEffect, useCallback } from 'react';

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

const STORAGE_KEY = 'chat_history';
const MAX_HISTORY = 20;

export function useChatHistory() {
  const [history, setHistory] = useState<ChatHistoryItem[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.map((item: ChatHistoryItem) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (e) {
        console.error('Failed to parse chat history:', e);
      }
    }
  }, []);

  // Save history to localStorage
  const saveHistory = useCallback((newHistory: ChatHistoryItem[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newHistory));
    setHistory(newHistory);
  }, []);

  const createNewChat = useCallback(() => {
    const newId = Date.now().toString();
    setActiveId(newId);
    return newId;
  }, []);

  const saveChat = useCallback((id: string, title: string, messages: ChatHistoryItem['messages']) => {
    setHistory(prev => {
      const existing = prev.findIndex(item => item.id === id);
      const newItem: ChatHistoryItem = {
        id,
        title: title.slice(0, 50) + (title.length > 50 ? '...' : ''),
        timestamp: new Date(),
        messageCount: messages.length,
        messages
      };

      let newHistory: ChatHistoryItem[];
      if (existing >= 0) {
        newHistory = [...prev];
        newHistory[existing] = newItem;
      } else {
        newHistory = [newItem, ...prev].slice(0, MAX_HISTORY);
      }

      saveHistory(newHistory);
      return newHistory;
    });
  }, [saveHistory]);

  const deleteChat = useCallback((id: string) => {
    setHistory(prev => {
      const newHistory = prev.filter(item => item.id !== id);
      saveHistory(newHistory);
      if (activeId === id) {
        setActiveId(null);
      }
      return newHistory;
    });
  }, [activeId, saveHistory]);

  const getChat = useCallback((id: string) => {
    return history.find(item => item.id === id);
  }, [history]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setHistory([]);
    setActiveId(null);
  }, []);

  return {
    history,
    activeId,
    setActiveId,
    createNewChat,
    saveChat,
    deleteChat,
    getChat,
    clearHistory
  };
}
