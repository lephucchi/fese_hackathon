/**
 * Saved News List Component
 * Responsibility: Display user's saved news articles
 */
'use client';

import { SavedNews } from '@/types/dashboard.types';

interface SavedNewsListProps {
    readonly articles: readonly SavedNews[];
    readonly onArticleClick?: (article: SavedNews) => void;
}

/**
 * Gets impact label styling based on type
 */
function getImpactClassName(type: 'positive' | 'negative' | 'neutral'): string {
    return `impact-label ${type}`;
}

/**
 * Gets impact emoji based on type
 */
function getImpactEmoji(type: 'positive' | 'negative' | 'neutral'): string {
    const emojiMap = {
        positive: '🟢',
        negative: '🔴',
        neutral: '⚪',
    };
    return emojiMap[type];
}

export function SavedNewsList({ articles, onArticleClick }: SavedNewsListProps) {
    if (articles.length === 0) {
        return (
            <div className="saved-news">
                <h2>Tiêu điểm của bạn (0)</h2>
                <p className="empty-state">Chưa có tin nào được lưu</p>
            </div>
        );
    }

    return (
        <div className="saved-news">
            <h2>Tiêu điểm của bạn ({articles.length})</h2>
            {articles.map((article) => (
                <div
                    key={article.id}
                    className="news-list-item"
                    onClick={() => onArticleClick?.(article)}
                    role={onArticleClick ? 'button' : undefined}
                    tabIndex={onArticleClick ? 0 : undefined}
                >
                    <h4>{article.title}</h4>
                    <p className="news-preview">{article.content.substring(0, 100)}...</p>

                    {article.impact && (
                        <span className={getImpactClassName(article.impact.type)}>
                            {getImpactEmoji(article.impact.type)} {article.impact.description}
                        </span>
                    )}
                </div>
            ))}
        </div>
    );
}
