/**
 * Market Tab Component - Macro News Analysis
 * Responsibility: Display macro economic news with impact analysis
 * Follows: AI agent assistant for macro news analysis
 */
'use client';

import { useState, useCallback } from 'react';
import { NewsArticle, SavedNews, SwipeAction } from '@/types/dashboard.types';
import { NewsCard } from './NewsCard';
import { SwipeActions } from './SwipeActions';
import { SavedNewsList } from './SavedNewsList';

interface MarketTabProps {
    readonly articles: readonly NewsArticle[];
    readonly savedArticles: readonly SavedNews[];
    readonly onSaveArticle: (article: NewsArticle) => void;
    readonly onArticleClick?: (article: SavedNews) => void;
}

export function MarketTab({
    articles,
    savedArticles,
    onSaveArticle,
    onArticleClick
}: MarketTabProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);

    const currentArticle = articles[currentIndex];
    const hasMoreArticles = currentIndex < articles.length - 1;

    /**
     * Handles swipe action (accept/reject)
     * Follows: Single responsibility, clear naming
     */
    const handleSwipeAction = useCallback((action: SwipeAction) => {
        if (isAnimating || !currentArticle) return;

        setIsAnimating(true);

        // Save article if accepted
        if (action === 'accept') {
            onSaveArticle(currentArticle);
        }

        // Move to next article after animation
        setTimeout(() => {
            if (hasMoreArticles) {
                setCurrentIndex((prev: number) => prev + 1);
            }
            setIsAnimating(false);
        }, 300);
    }, [currentArticle, hasMoreArticles, isAnimating, onSaveArticle]);

    return (
        <>
            <div className="market-tab-wrapper">
                <div className="briefing-header">
                    <div className="briefing-title">
                        <h1>📊 Phân tích Vĩ mô</h1>
                        <p className="briefing-subtitle">
                            Tin tức kinh tế và chỉ số vĩ mô ảnh hưởng đến danh mục của bạn
                        </p>
                    </div>
                    <div className="briefing-stats">
                        <div className="stat-badge">
                            <span className="stat-label">Tin hôm nay</span>
                            <span className="stat-value">{articles.length}</span>
                        </div>
                        <div className="stat-badge">
                            <span className="stat-label">Đã lưu</span>
                            <span className="stat-value">{savedArticles.length}</span>
                        </div>
                    </div>
                </div>

                {currentArticle ? (
                    <>
                        <div className="article-progress">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${((currentIndex + 1) / articles.length) * 100}%` }}
                                />
                            </div>
                            <span className="progress-text">{currentIndex + 1} / {articles.length}</span>
                        </div>

                        <div className="swipe-container">
                            <NewsCard news={currentArticle} />
                        </div>

                        <SwipeActions
                            onAction={handleSwipeAction}
                            disabled={isAnimating}
                        />
                    </>
                ) : (
                    <div className="empty-briefing">
                        <div className="empty-icon">✨</div>
                        <p>Bạn đã xem hết tin tức hôm nay!</p>
                        <p className="empty-subtitle">Quay lại sau để cập nhật thêm tin tức vĩ mô</p>
                    </div>
                )}

                {savedArticles.length > 0 && (
                    <SavedNewsList
                        articles={savedArticles}
                        onArticleClick={onArticleClick}
                    />
                )}
            </div>
        </>
    );
}
