/**
 * Dashboard Hook
 * Responsibility: Manage dashboard state and data fetching
 * Follows: Single responsibility, separation of concerns
 */
'use client';

import { useState, useCallback } from 'react';
import { 
  TabId, 
  NewsArticle, 
  SavedNews, 
  AcademyContent 
} from '@/types/dashboard.types';

export function useDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('market');
  const [savedArticles, setSavedArticles] = useState<SavedNews[]>([]);

  /**
   * Handles tab switching
   */
  const handleTabChange = useCallback((tab: TabId) => {
    setActiveTab(tab);
  }, []);

  /**
   * Saves a news article
   * Validates input before processing
   */
  const handleSaveArticle = useCallback((article: NewsArticle) => {
    if (!article || !article.id) {
      console.error('Invalid article to save');
      return;
    }

    const savedArticle: SavedNews = {
      ...article,
      savedAt: new Date(),
    };

    setSavedArticles(prev => {
      // Prevent duplicates
      if (prev.some(a => a.id === article.id)) {
        return prev;
      }
      return [savedArticle, ...prev];
    });
  }, []);

  /**
   * Opens chat interface
   */
  const handleOpenChat = useCallback(() => {
    // Navigate to chat page or open modal
    window.location.href = '/chat';
  }, []);

  /**
   * Handles content click in Academy tab
   */
  const handleContentClick = useCallback((content: AcademyContent) => {
    if (!content) {
      console.error('Invalid content');
      return;
    }

    // TODO: Implement content view logic
    console.log('Content clicked:', content.title);
  }, []);

  /**
   * Handles portfolio edit action
   */
  const handleEditPortfolio = useCallback(() => {
    // TODO: Implement portfolio edit logic
    console.log('Edit portfolio clicked');
  }, []);

  return {
    activeTab,
    savedArticles,
    handleTabChange,
    handleSaveArticle,
    handleOpenChat,
    handleContentClick,
    handleEditPortfolio,
  };
}
