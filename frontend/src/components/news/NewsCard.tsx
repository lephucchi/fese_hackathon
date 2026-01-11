'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus, ExternalLink, Clock, Tag } from 'lucide-react';
import { NewsArticle } from '@/types/dashboard.types';
import { NewsItem } from '@/services/api/news.service';

// Union type to support both NewsItem and NewsArticle
type NewsData = NewsItem | NewsArticle;

interface NewsCardProps {
    news: NewsData;
    onCardClick?: (news: NewsData) => void;
    variant?: 'default' | 'compact';
}

// Type guard to check if news is NewsItem
function isNewsItem(news: NewsData): news is NewsItem {
    return 'news_id' in news;
}

export function NewsCard({ news, onCardClick, variant = 'default' }: NewsCardProps) {
    const sentimentConfig = {
        positive: {
            color: 'var(--success)',
            bgColor: 'rgba(46, 204, 113, 0.1)',
            icon: TrendingUp,
            label: 'Tích cực'
        },
        negative: {
            color: 'var(--error)',
            bgColor: 'rgba(231, 76, 60, 0.1)',
            icon: TrendingDown,
            label: 'Tiêu cực'
        },
        neutral: {
            color: 'var(--warning)',
            bgColor: 'rgba(243, 156, 18, 0.1)',
            icon: Minus,
            label: 'Trung lập'
        }
    };

    // Extract sentiment based on type
    const getSentiment = (): keyof typeof sentimentConfig => {
        if (isNewsItem(news)) {
            return (news.sentiment?.toLowerCase() || 'neutral') as keyof typeof sentimentConfig;
        } else {
            return (news.impact?.type || 'neutral') as keyof typeof sentimentConfig;
        }
    };

    const sentiment = getSentiment();
    const config = sentimentConfig[sentiment] || sentimentConfig.neutral;
    const SentimentIcon = config.icon;

    // Format date
    const formatDate = (dateString: string | Date | null) => {
        if (!dateString) return 'Mới nhất';
        const date = dateString instanceof Date ? dateString : new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffHours < 1) return 'Vừa xong';
        if (diffHours < 24) return `${diffHours} giờ trước`;
        if (diffDays < 7) return `${diffDays} ngày trước`;
        return date.toLocaleDateString('vi-VN');
    };

    // Helper functions to extract data based on type
    const getPublishedDate = (): string | Date | null => {
        if (isNewsItem(news)) {
            return news.published_at;
        } else {
            return news.publishedAt;
        }
    };

    const getTags = (): string[] => {
        if (isNewsItem(news)) {
            return news.tickers.map(t => t.ticker);
        } else {
            return news.tags as string[];
        }
    };

    const getSource = (): string | null => {
        if (isNewsItem(news)) {
            return news.source_url;
        } else {
            return news.source;
        }
    };

    const tags = getTags();
    const publishedDate = getPublishedDate();
    const source = getSource();

    // Truncate content
    const truncateContent = (content: string | null, maxLength: number = 150) => {
        if (!content) return 'Không có nội dung';
        if (content.length <= maxLength) return content;
        return content.substring(0, maxLength).trim() + '...';
    };

    if (variant === 'compact') {
        return (
            <div
                onClick={() => onCardClick?.(news)}
                style={{
                    background: 'var(--card)',
                    borderRadius: '12px',
                    padding: '1rem',
                    cursor: onCardClick ? 'pointer' : 'default',
                    transition: 'all 0.2s ease',
                    border: '1px solid var(--border)',
                }}
                className="interactive-scale"
                onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = 'none';
                    e.currentTarget.style.borderColor = 'var(--border)';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    {/* Sentiment Indicator */}
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        background: config.bgColor,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                    }}>
                        <SentimentIcon size={20} color={config.color} />
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h4 style={{
                            fontSize: '0.9rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)',
                            marginBottom: '0.25rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {news.title}
                        </h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                                {formatDate(publishedDate)}
                            </span>
                            {tags.length > 0 && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    padding: '0.125rem 0.375rem',
                                    borderRadius: '4px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: 600
                                }}>
                                    {tags[0]}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={() => onCardClick?.(news)}
            style={{
                background: 'var(--card)',
                borderRadius: '16px',
                overflow: 'hidden',
                cursor: onCardClick ? 'pointer' : 'default',
                transition: 'all 0.3s ease',
                border: '1px solid var(--border)',
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
            }}
            className="interactive-scale"
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = config.color;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'var(--border)';
            }}
        >
            {/* Header with Sentiment */}
            <div style={{
                padding: '1rem 1.25rem',
                background: config.bgColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: `1px solid ${config.color}20`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <SentimentIcon size={18} color={config.color} />
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: config.color,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        {config.label}
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-tertiary)' }}>
                    <Clock size={14} />
                    <span style={{ fontSize: '0.75rem' }}>{formatDate(publishedDate)}</span>
                </div>
            </div>

            {/* Content */}
            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                {/* Title */}
                <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: '0.75rem',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {news.title}
                </h3>

                {/* Content Preview */}
                <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: '1rem',
                    flex: 1,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                }}>
                    {truncateContent(news.content, 200)}
                </p>

                {/* Footer */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                }}>
                    {/* Tags */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', flexWrap: 'wrap' }}>
                        {tags.slice(0, 3).map((tag: string) => (
                            <span
                                key={tag}
                                style={{
                                    fontSize: '0.75rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '6px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <Tag size={10} />
                                {tag}
                            </span>
                        ))}
                        {tags.length > 3 && (
                            <span style={{
                                fontSize: '0.7rem',
                                color: 'var(--text-tertiary)',
                                fontWeight: 500
                            }}>
                                +{tags.length - 3}
                            </span>
                        )}
                    </div>

                    {/* Source */}
                    {source && (
                        <div style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontWeight: 500
                        }}>
                            <ExternalLink size={12} />
                            {isNewsItem(news) ? (
                                <a href={source} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                                    Nguồn
                                </a>
                            ) : source}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
