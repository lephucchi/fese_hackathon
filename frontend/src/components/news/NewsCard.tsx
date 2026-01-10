/**
 * News Card Component - Macro Analysis Focused
 * Responsibility: Display news article with impact analysis and macro indicators
 */
'use client';

import React from 'react';
import { NewsArticle } from '@/types/dashboard.types';

interface NewsCardProps {
    readonly article: NewsArticle;
    readonly style?: React.CSSProperties;
}

/**
 * Formats date to display time
 */
function formatPublishTime(date: Date): string {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Get impact indicator based on article content
 */
function getImpactLevel(tags: readonly string[]): 'high' | 'medium' | 'low' {
    const highImpactKeywords = ['gdp', 'cpi', 'fed', 'interest rate', 'inflation', 'employment'];
    const hasHighImpact = tags.some(tag =>
        highImpactKeywords.some(keyword => tag.toLowerCase().includes(keyword))
    );
    return hasHighImpact ? 'high' : 'medium';
}

/**
 * Get impact icon based on tags
 */
function getImpactIcon(tags: readonly string[]): string {
    if (tags.some(t => t.toLowerCase().includes('positive'))) return '📈';
    if (tags.some(t => t.toLowerCase().includes('negative'))) return '📉';
    return '⚡';
}

export function NewsCard({ article, style }: NewsCardProps) {
    const impactLevel = getImpactLevel(article.tags);
    const impactIcon = getImpactIcon(article.tags);

    return (
        <div className="news-card macro-focused" style={style}>
            {/* Header with impact badge */}
            <div className="news-card-header">
                <div className={`impact-badge impact-${impactLevel}`}>
                    <span className="impact-icon">{impactIcon}</span>
                    <span className="impact-text">
                        {impactLevel === 'high' ? 'Ảnh hưởng cao' : 'Ảnh hưởng trung bình'}
                    </span>
                </div>
                <div className="source-badge">
                    {article.source}
                </div>
            </div>

            {/* Image/Visual */}
            <div className="news-card-image">
                {article.imageUrl ? (
                    <img src={article.imageUrl} alt={article.title} />
                ) : (
                    <div className="image-placeholder">{impactIcon}</div>
                )}
            </div>

            {/* Content */}
            <div className="news-card-content">
                {article.tags.length > 0 && (
                    <div className="news-tags macro-tags">
                        {article.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="tag macro-tag">
                                {tag}
                            </span>
                        ))}
                        {article.tags.length > 3 && (
                            <span className="tag more-tags">+{article.tags.length - 3}</span>
                        )}
                    </div>
                )}

                <h3 className="news-title">{article.title}</h3>

                {/* Macro analysis summary - AI generated */}
                <div className="macro-summary">
                    <p className="summary-intro">💡 Phân tích vĩ mô:</p>
                    <p className="summary-text">
                        Tin tức này liên quan đến các chỉ số kinh tế vĩ mô.
                        Có thể ảnh hưởng đến lãi suất, tỷ giá hối đoái và hiệu suất danh mục của bạn.
                    </p>
                </div>

                {/* Meta information */}
                <div className="news-meta macro-meta">
                    <span className="meta-item">⏰ {formatPublishTime(article.publishedAt)}</span>
                    <span className="meta-divider">•</span>
                    <span className="meta-item">📰 {article.source}</span>
                </div>

                {/* Action hint */}
                <div className="action-hint">
                    <span>👍 Lưu tin | 👎 Bỏ qua</span>
                </div>
            </div>
        </div>
    );
}
