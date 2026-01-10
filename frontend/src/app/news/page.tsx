/**
 * News Page - All News Feed
 * Displays all news from /api/news with filtering and pagination
 */
'use client';

import React, { useState } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { NewsCard } from '@/components/news/NewsCard';
import { useNewsList } from '@/hooks/useNewsList';
import { NewsItem } from '@/services/api/news.service';
import {
    Loader2,
    AlertCircle,
    TrendingUp,
    TrendingDown,
    Minus,
    Newspaper,
    ChevronLeft,
    ChevronRight,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function NewsPage() {
    const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
    const {
        news,
        loading,
        error,
        page,
        totalPages,
        total,
        hasNext,
        hasPrev,
        nextPage,
        prevPage,
        refetch,
        setSentimentFilter
    } = useNewsList({ pageSize: 12 });

    const [activeFilter, setActiveFilter] = useState<string | undefined>(undefined);

    const handleFilterChange = (sentiment: string | undefined) => {
        setActiveFilter(sentiment);
        setSentimentFilter(sentiment);
    };

    const handleCardClick = (newsItem: NewsItem) => {
        setSelectedNews(newsItem);
    };

    const filters = [
        { key: undefined, label: 'Tất cả', icon: Newspaper, color: 'var(--primary)' },
        { key: 'positive', label: 'Tích cực', icon: TrendingUp, color: 'var(--success)' },
        { key: 'negative', label: 'Tiêu cực', icon: TrendingDown, color: 'var(--error)' },
        { key: 'neutral', label: 'Trung lập', icon: Minus, color: 'var(--warning)' },
    ];

    return (
        <div style={{
            background: 'var(--background)',
            minHeight: '100vh',
            paddingBottom: '2rem'
        }}>
            <Navigation />

            {/* Header */}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '2rem 1.5rem 1rem'
            }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    gap: '1rem'
                }}>
                    <div>
                        <h1 style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            marginBottom: '0.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.75rem'
                        }}>
                            <Newspaper size={32} color="var(--primary)" />
                            Tin tức Tài chính
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            Cập nhật {total} tin tức mới nhất từ thị trường
                        </p>
                    </div>

                    <button
                        onClick={() => refetch()}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '0.9rem',
                            opacity: loading ? 0.7 : 1,
                            transition: 'all 0.2s'
                        }}
                    >
                        <RefreshCw size={18} className={loading ? 'spin' : ''} />
                        Làm mới
                    </button>
                </div>

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: '0.75rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem'
                }}>
                    {filters.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = activeFilter === filter.key;
                        return (
                            <button
                                key={filter.key ?? 'all'}
                                onClick={() => handleFilterChange(filter.key)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.625rem 1rem',
                                    background: isActive ? filter.color : 'var(--surface)',
                                    color: isActive ? 'white' : 'var(--text-secondary)',
                                    border: `1px solid ${isActive ? filter.color : 'var(--border)'}`,
                                    borderRadius: '20px',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s'
                                }}
                            >
                                <Icon size={16} />
                                {filter.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 1.5rem'
            }}>
                {/* Loading State */}
                {loading && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4rem',
                        color: 'var(--text-secondary)'
                    }}>
                        <Loader2 size={32} className="spin" style={{ marginRight: '0.75rem' }} />
                        Đang tải tin tức...
                    </div>
                )}

                {/* Error State */}
                {error && !loading && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4rem',
                        color: 'var(--error)',
                        textAlign: 'center'
                    }}>
                        <AlertCircle size={48} style={{ marginBottom: '1rem' }} />
                        <h3 style={{ marginBottom: '0.5rem', fontWeight: 600 }}>Đã có lỗi xảy ra</h3>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error}</p>
                        <button
                            onClick={() => refetch()}
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                fontWeight: 600
                            }}
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* News Grid */}
                {!loading && !error && (
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={page + (activeFilter ?? 'all')}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                                gap: '1.5rem'
                            }}
                        >
                            {news.map((item, index) => (
                                <motion.div
                                    key={item.news_id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <NewsCard
                                        news={item}
                                        onCardClick={handleCardClick}
                                    />
                                </motion.div>
                            ))}
                        </motion.div>
                    </AnimatePresence>
                )}

                {/* Empty State */}
                {!loading && !error && news.length === 0 && (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '4rem',
                        color: 'var(--text-secondary)',
                        textAlign: 'center'
                    }}>
                        <Newspaper size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <h3 style={{ marginBottom: '0.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                            Không có tin tức
                        </h3>
                        <p>Chưa có tin tức nào phù hợp với bộ lọc của bạn</p>
                    </div>
                )}

                {/* Pagination */}
                {!loading && !error && news.length > 0 && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '1rem',
                        marginTop: '2.5rem',
                        padding: '1rem'
                    }}>
                        <button
                            onClick={prevPage}
                            disabled={!hasPrev}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: hasPrev ? 'var(--surface)' : 'var(--border)',
                                color: hasPrev ? 'var(--text-primary)' : 'var(--text-tertiary)',
                                border: '1px solid var(--border)',
                                borderRadius: '10px',
                                cursor: hasPrev ? 'pointer' : 'not-allowed',
                                fontWeight: 500,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            <ChevronLeft size={18} />
                            Trước
                        </button>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.5rem',
                            background: 'var(--surface)',
                            borderRadius: '10px',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                        }}>
                            <span style={{ color: 'var(--primary)' }}>{page}</span>
                            <span style={{ color: 'var(--text-tertiary)' }}>/</span>
                            <span>{totalPages || 1}</span>
                        </div>

                        <button
                            onClick={nextPage}
                            disabled={!hasNext}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.75rem 1.25rem',
                                background: hasNext ? 'var(--primary)' : 'var(--border)',
                                color: hasNext ? 'white' : 'var(--text-tertiary)',
                                border: 'none',
                                borderRadius: '10px',
                                cursor: hasNext ? 'pointer' : 'not-allowed',
                                fontWeight: 500,
                                fontSize: '0.9rem',
                                transition: 'all 0.2s'
                            }}
                        >
                            Tiếp
                            <ChevronRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {/* News Detail Modal */}
            <AnimatePresence>
                {selectedNews && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSelectedNews(null)}
                        style={{
                            position: 'fixed',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.7)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                                background: 'var(--card)',
                                borderRadius: '20px',
                                maxWidth: '700px',
                                width: '100%',
                                maxHeight: '80vh',
                                overflow: 'auto',
                                padding: '2rem'
                            }}
                        >
                            <h2 style={{
                                fontSize: '1.5rem',
                                fontWeight: 700,
                                color: 'var(--text-primary)',
                                marginBottom: '1rem',
                                lineHeight: 1.4
                            }}>
                                {selectedNews.title}
                            </h2>

                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                marginBottom: '1.5rem',
                                flexWrap: 'wrap'
                            }}>
                                {selectedNews.tickers.map((ticker) => (
                                    <span
                                        key={ticker.ticker}
                                        style={{
                                            padding: '0.375rem 0.75rem',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            borderRadius: '6px',
                                            fontSize: '0.875rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        {ticker.ticker}
                                    </span>
                                ))}
                                <span style={{
                                    color: 'var(--text-tertiary)',
                                    fontSize: '0.875rem'
                                }}>
                                    {selectedNews.published_at
                                        ? new Date(selectedNews.published_at).toLocaleString('vi-VN')
                                        : 'Mới nhất'
                                    }
                                </span>
                            </div>

                            <p style={{
                                fontSize: '1rem',
                                lineHeight: 1.8,
                                color: 'var(--text-secondary)',
                                whiteSpace: 'pre-wrap'
                            }}>
                                {selectedNews.content || 'Không có nội dung chi tiết'}
                            </p>

                            {selectedNews.source_url && (
                                <a
                                    href={selectedNews.source_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                        display: 'inline-block',
                                        marginTop: '1.5rem',
                                        padding: '0.75rem 1.5rem',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        borderRadius: '10px',
                                        textDecoration: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.9rem'
                                    }}
                                >
                                    Đọc bài gốc →
                                </a>
                            )}

                            <button
                                onClick={() => setSelectedNews(null)}
                                style={{
                                    position: 'absolute',
                                    top: '1rem',
                                    right: '1rem',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'var(--surface)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer',
                                    fontSize: '1.25rem',
                                    fontWeight: 600
                                }}
                            >
                                ×
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
