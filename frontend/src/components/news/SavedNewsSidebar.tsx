'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bookmark,
    TrendingUp,
    TrendingDown,
    Minus,
    ExternalLink,
    Loader2,
    Sparkles,
    Tag,
    X,
    ChevronRight
} from 'lucide-react';
import { SavedNewsItem } from '@/hooks/useSavedNews';

interface SavedNewsSidebarProps {
    savedNews: SavedNewsItem[];
    loading: boolean;
    total: number;
    isOpen: boolean;
    onToggle: () => void;
    onNewsClick?: (news: SavedNewsItem) => void;
}

export function SavedNewsSidebar({
    savedNews,
    loading,
    total,
    isOpen,
    onToggle,
    onNewsClick
}: SavedNewsSidebarProps) {
    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

        if (diffHours < 1) return 'Vừa xong';
        if (diffHours < 24) return `${diffHours}h trước`;
        return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    };

    // Sentiment config
    const getSentimentConfig = (sentiment: string | null) => {
        const s = sentiment?.toLowerCase();
        switch (s) {
            case 'positive':
                return { color: '#2ECC71', icon: TrendingUp };
            case 'negative':
                return { color: '#E74C3C', icon: TrendingDown };
            default:
                return { color: '#F39C12', icon: Minus };
        }
    };

    return (
        <>
            {/* Toggle Button - always visible */}
            <motion.button
                onClick={onToggle}
                style={{
                    position: 'fixed',
                    right: isOpen ? '340px' : '0',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 100,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 0.5rem 0.75rem 0.75rem',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px 0 0 12px',
                    cursor: 'pointer',
                    boxShadow: 'var(--shadow-lg)',
                    transition: 'right 0.3s ease'
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
            >
                <Bookmark size={20} />
                {total > 0 && (
                    <span style={{
                        background: 'white',
                        color: 'var(--primary)',
                        padding: '0.125rem 0.5rem',
                        borderRadius: '10px',
                        fontSize: '0.75rem',
                        fontWeight: 700
                    }}>
                        {total}
                    </span>
                )}
                <ChevronRight
                    size={16}
                    style={{
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s'
                    }}
                />
            </motion.button>

            {/* Sidebar */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            right: 0,
                            top: 0,
                            bottom: 0,
                            width: '340px',
                            background: 'var(--card)',
                            borderLeft: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-xl)',
                            zIndex: 99,
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '1.25rem',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'rgba(0, 200, 5, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Bookmark size={20} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{
                                        fontSize: '1rem',
                                        fontWeight: 700,
                                        color: 'var(--text-primary)',
                                        marginBottom: '0.125rem'
                                    }}>
                                        Tin đã quan tâm
                                    </h3>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--text-tertiary)'
                                    }}>
                                        {total} bài • Sẽ dùng cho AI
                                    </span>
                                </div>
                            </div>
                            <button
                                onClick={onToggle}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: 'var(--surface)',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* AI Context Hint */}
                        <div style={{
                            padding: '0.75rem 1.25rem',
                            background: 'rgba(0, 200, 5, 0.08)',
                            borderBottom: '1px solid var(--border)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}>
                            <Sparkles size={14} color="var(--primary)" />
                            <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-secondary)'
                            }}>
                                Các tin này sẽ là context cho AI cá nhân hóa
                            </span>
                        </div>

                        {/* News List */}
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: '0.75rem'
                        }}>
                            {loading && savedNews.length === 0 && (
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '2rem',
                                    color: 'var(--text-tertiary)'
                                }}>
                                    <Loader2 size={24} className="spin" />
                                </div>
                            )}

                            {!loading && savedNews.length === 0 && (
                                <div style={{
                                    textAlign: 'center',
                                    padding: '2rem 1rem',
                                    color: 'var(--text-tertiary)'
                                }}>
                                    <Bookmark size={40} style={{ opacity: 0.3, marginBottom: '0.75rem' }} />
                                    <p style={{ fontSize: '0.875rem' }}>
                                        Chưa có tin nào được lưu
                                    </p>
                                    <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                        Quẹt phải để lưu tin quan tâm
                                    </p>
                                </div>
                            )}

                            <AnimatePresence mode="popLayout">
                                {savedNews.map((news, index) => {
                                    const config = getSentimentConfig(news.sentiment);
                                    const SentimentIcon = config.icon;

                                    return (
                                        <motion.div
                                            key={news.news_id}
                                            initial={{ opacity: 0, x: 50, scale: 0.9 }}
                                            animate={{ opacity: 1, x: 0, scale: 1 }}
                                            exit={{ opacity: 0, x: -50, scale: 0.9 }}
                                            transition={{ delay: index * 0.05 }}
                                            onClick={() => onNewsClick?.(news)}
                                            style={{
                                                padding: '0.875rem',
                                                marginBottom: '0.5rem',
                                                background: 'var(--surface)',
                                                borderRadius: '12px',
                                                cursor: onNewsClick ? 'pointer' : 'default',
                                                border: '1px solid transparent',
                                                transition: 'all 0.2s'
                                            }}
                                            whileHover={{
                                                borderColor: 'var(--primary)',
                                                boxShadow: 'var(--shadow-md)'
                                            }}
                                        >
                                            {/* Header row */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                marginBottom: '0.5rem'
                                            }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.375rem'
                                                }}>
                                                    <SentimentIcon size={12} color={config.color} />
                                                    {news.tickers.slice(0, 2).map((t) => (
                                                        <span
                                                            key={t.ticker}
                                                            style={{
                                                                fontSize: '0.65rem',
                                                                padding: '0.125rem 0.375rem',
                                                                borderRadius: '4px',
                                                                background: 'var(--primary)',
                                                                color: 'white',
                                                                fontWeight: 600
                                                            }}
                                                        >
                                                            {t.ticker}
                                                        </span>
                                                    ))}
                                                </div>
                                                <span style={{
                                                    fontSize: '0.65rem',
                                                    color: 'var(--text-tertiary)'
                                                }}>
                                                    {formatDate(news.published_at)}
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <h4 style={{
                                                fontSize: '0.85rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                                lineHeight: 1.4,
                                                display: '-webkit-box',
                                                WebkitLineClamp: 2,
                                                WebkitBoxOrient: 'vertical',
                                                overflow: 'hidden'
                                            }}>
                                                {news.title}
                                            </h4>

                                            {/* Source link */}
                                            {news.source_url && (
                                                <a
                                                    href={news.source_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        color: 'var(--primary)',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.25rem',
                                                        marginTop: '0.5rem',
                                                        textDecoration: 'none'
                                                    }}
                                                >
                                                    Nguồn <ExternalLink size={10} />
                                                </a>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Footer */}
                        {total > 0 && (
                            <div style={{
                                padding: '1rem 1.25rem',
                                borderTop: '1px solid var(--border)',
                                background: 'var(--surface)'
                            }}>
                                <button
                                    style={{
                                        width: '100%',
                                        padding: '0.75rem',
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        fontWeight: 600,
                                        fontSize: '0.875rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <Sparkles size={16} />
                                    Chat với AI về {total} tin
                                </button>
                            </div>
                        )}
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
        </>
    );
}
