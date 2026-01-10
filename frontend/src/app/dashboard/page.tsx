/**
 * Dashboard Page - MacroInsight Market
 * Swipe-based news filtering interface using /api/news
 */
'use client';

import React, { useState, useEffect } from 'react';
import { CompletionScreen } from '@/components/news/CompletionScreen';
import { Navigation } from '@/components/shared/Navigation';
import { Coins, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNewsSwipe, NewsSwipeItem } from '@/hooks/useNewsSwipe';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, ExternalLink, Tag } from 'lucide-react';

// News Swipe Card Component with content display
function NewsSwipeCard({
  news,
  onSwipeLeft,
  onSwipeRight,
  isTop,
  stackIndex,
  totalCards,
}: {
  news: NewsSwipeItem;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  isTop: boolean;
  stackIndex: number;
  totalCards: number;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-25, 25]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0, 1, 1, 1, 0]);

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (Math.abs(info.offset.x) > 100) {
      if (info.offset.x > 0) {
        onSwipeRight();
      } else {
        onSwipeLeft();
      }
    }
  };

  const sentimentConfig = {
    positive: { color: '#2ECC71', icon: TrendingUp, label: 'Tích cực' },
    negative: { color: '#E74C3C', icon: TrendingDown, label: 'Tiêu cực' },
    neutral: { color: '#F39C12', icon: Minus, label: 'Trung lập' },
  };

  const sentiment = (news.sentiment?.toLowerCase() || 'neutral') as keyof typeof sentimentConfig;
  const config = sentimentConfig[sentiment] || sentimentConfig.neutral;
  const SentimentIcon = config.icon;

  // Truncate content for display
  const truncateContent = (content: string | null, maxLength: number = 300) => {
    if (!content) return 'Không có nội dung chi tiết';
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Mới nhất';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isTop) {
    // Background cards in stack
    return (
      <div
        style={{
          position: 'absolute',
          top: `${stackIndex * 8}px`,
          left: '50%',
          transform: `translateX(-50%) scale(${1 - stackIndex * 0.05})`,
          width: '100%',
          maxWidth: '420px',
          height: '520px',
          background: 'var(--card)',
          borderRadius: '24px',
          boxShadow: 'var(--shadow-lg)',
          zIndex: totalCards - stackIndex,
          opacity: 1 - stackIndex * 0.3
        }}
      />
    );
  }

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{
        x,
        rotate,
        opacity,
        position: 'relative',
        width: '100%',
        maxWidth: '420px',
        height: '520px',
        background: 'var(--card)',
        borderRadius: '24px',
        boxShadow: 'var(--shadow-xl)',
        cursor: 'grab',
        zIndex: totalCards,
        overflow: 'hidden',
        margin: '0 auto'
      }}
      onDragEnd={handleDragEnd}
      whileTap={{ cursor: 'grabbing' }}
    >
      {/* Swipe Indicators */}
      <motion.div
        style={{
          position: 'absolute',
          top: '1.5rem',
          left: '1.5rem',
          padding: '0.625rem 1.25rem',
          borderRadius: '10px',
          background: 'rgba(231, 76, 60, 0.9)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1rem',
          opacity: useTransform(x, [-100, -50, 0], [1, 0.5, 0]),
          zIndex: 10
        }}
      >
        BỎ QUA
      </motion.div>

      <motion.div
        style={{
          position: 'absolute',
          top: '1.5rem',
          right: '1.5rem',
          padding: '0.625rem 1.25rem',
          borderRadius: '10px',
          background: 'rgba(46, 204, 113, 0.9)',
          color: 'white',
          fontWeight: 700,
          fontSize: '1rem',
          opacity: useTransform(x, [0, 50, 100], [0, 0.5, 1]),
          zIndex: 10
        }}
      >
        QUAN TÂM
      </motion.div>

      {/* Card Content */}
      <div style={{
        padding: '1.5rem',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header: Sentiment + Date */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.375rem 0.75rem',
            borderRadius: '8px',
            background: `${config.color}20`
          }}>
            <SentimentIcon size={16} color={config.color} />
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: config.color,
              textTransform: 'uppercase'
            }}>
              {config.label}
            </span>
          </div>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)'
          }}>
            {formatDate(news.published_at)}
          </span>
        </div>

        {/* Tickers */}
        {news.tickers.length > 0 && (
          <div style={{
            display: 'flex',
            gap: '0.375rem',
            flexWrap: 'wrap',
            marginBottom: '0.75rem'
          }}>
            {news.tickers.slice(0, 4).map((ticker) => (
              <span
                key={ticker}
                style={{
                  fontSize: '0.7rem',
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
                {ticker}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          marginBottom: '0.75rem',
          lineHeight: 1.3,
          color: 'var(--text-primary)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {news.title}
        </h3>

        {/* Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          marginBottom: '1rem'
        }}>
          <p style={{
            fontSize: '0.9rem',
            lineHeight: 1.7,
            color: 'var(--text-secondary)'
          }}>
            {truncateContent(news.content)}
          </p>
        </div>

        {/* Footer: Source + Keywords */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '0.75rem',
          borderTop: '1px solid var(--border)'
        }}>
          {news.source_url && (
            <a
              href={news.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                fontSize: '0.75rem',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Đọc nguồn <ExternalLink size={12} />
            </a>
          )}

          {news.keywords.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '0.375rem',
              flexWrap: 'wrap',
              justifyContent: 'flex-end'
            }}>
              {news.keywords.slice(0, 2).map((kw) => (
                <span
                  key={kw}
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-tertiary)',
                    background: 'var(--surface)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px'
                  }}
                >
                  #{kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { stack, loading, error, remaining, swipeRight, swipeLeft, refetch, savedCount, total } = useNewsSwipe(20);

  const [mPoints, setMPoints] = useState(650);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [pointsEarnedToday, setPointsEarnedToday] = useState(0);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSwipeRight = async (newsId: string) => {
    await swipeRight(newsId);
    setMPoints(mPoints + 2);
    setPointsEarnedToday(pointsEarnedToday + 2);
    setShowPointsAnimation(true);
    setCurrentCardIndex(currentCardIndex + 1);
    setTimeout(() => setShowPointsAnimation(false), 1000);
  };

  const handleSwipeLeft = async (newsId: string) => {
    await swipeLeft(newsId);
    setCurrentCardIndex(currentCardIndex + 1);
  };

  const handleRefresh = () => {
    refetch();
    setCurrentCardIndex(0);
    setPointsEarnedToday(0);
  };

  const handleButtonClick = (direction: 'left' | 'right') => {
    if (stack.length === 0) return;
    const currentNews = stack[0];

    if (direction === 'right') {
      handleSwipeRight(currentNews.news_id);
    } else {
      handleSwipeLeft(currentNews.news_id);
    }
  };

  // Show loading state
  if (authLoading || loading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
        <Navigation />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)',
          paddingTop: '80px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <Loader2 size={48} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>{t('dashboard.loading')}</p>
          </div>
        </div>
        <style jsx global>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh', width: '100%' }}>
        <Navigation />
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 'calc(100vh - 80px)',
          paddingTop: '80px',
          padding: 'clamp(80px, 10vh, 120px) clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 1.5rem)'
        }}>
          <div style={{
            textAlign: 'center',
            maxWidth: '400px',
            width: '100%',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            background: 'var(--card)',
            borderRadius: '16px',
            border: '1px solid var(--border)'
          }}>
            <AlertCircle size={48} style={{ color: '#EF4444', margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              {t('dashboard.error')}
            </h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>{error}</p>
            <button
              onClick={handleRefresh}
              className="interactive-scale"
              style={{
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {t('dashboard.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', width: '100%' }}>
      <Navigation />
      <main style={{
        paddingTop: 'clamp(80px, 15vh, 100px)',
        padding: 'clamp(80px, 15vh, 100px) clamp(1rem, 3vw, 1.5rem) clamp(1rem, 3vw, 2rem)',
        maxWidth: '900px',
        margin: '0 auto',
        width: '100%'
      }}>
        {/* Progress Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.5rem, 2vw, 0.75rem)',
          marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
          padding: 'clamp(0.75rem, 2vw, 1rem)',
          background: 'var(--card)',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Coins size={16} style={{ color: '#FFC107' }} />
            <span style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFC107', position: 'relative' }}>
              {mPoints}
              <AnimatePresence>
                {showPointsAnimation && (
                  <motion.span
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: 1, y: -20 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      top: '-0.75rem',
                      right: '-1.5rem',
                      color: '#4ADE80',
                      fontWeight: 800,
                      fontSize: '0.75rem'
                    }}
                  >
                    +2
                  </motion.span>
                )}
              </AnimatePresence>
            </span>
          </div>
          <div style={{
            flex: 1,
            height: '6px',
            background: 'var(--surface)',
            borderRadius: '3px',
            overflow: 'hidden'
          }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${total > 0 ? ((total - remaining) / total) * 100 : 0}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: 'linear-gradient(90deg, var(--primary) 0%, #4ADE80 100%)',
                borderRadius: '3px'
              }}
            />
          </div>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-tertiary)',
            fontWeight: 600
          }}>
            {total - remaining}/{total}
          </span>
        </div>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            fontSize: '1.75rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            marginBottom: '0.5rem'
          }}>
            Tin tức Tài chính
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)'
          }}>
            <Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Lướt để lọc tin tức quan trọng • {total} tin mới nhất
          </p>
        </div>

        {stack.length === 0 ? (
          <CompletionScreen
            totalCards={currentCardIndex}
            savedCount={savedCount}
            pointsEarned={pointsEarnedToday}
            onRefresh={handleRefresh}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            width: '100%'
          }}>
            {/* Left Button - Skip */}
            <button
              onClick={() => handleButtonClick('left')}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: '2px solid var(--error)',
                background: 'var(--card)',
                color: 'var(--error)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-lg)',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--error)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.transform = 'scale(1.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--card)';
                e.currentTarget.style.color = 'var(--error)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <ChevronLeft size={28} strokeWidth={3} />
            </button>

            {/* Card Stack */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
              {/* Background cards */}
              {stack.slice(1, 3).map((news, index) => (
                <NewsSwipeCard
                  key={news.news_id}
                  news={news}
                  onSwipeLeft={() => { }}
                  onSwipeRight={() => { }}
                  isTop={false}
                  stackIndex={index + 1}
                  totalCards={stack.length}
                />
              ))}

              {/* Top card */}
              <NewsSwipeCard
                news={stack[0]}
                onSwipeLeft={() => handleSwipeLeft(stack[0].news_id)}
                onSwipeRight={() => handleSwipeRight(stack[0].news_id)}
                isTop={true}
                stackIndex={0}
                totalCards={stack.length}
              />
            </div>

            {/* Right Button - Save */}
            <button
              onClick={() => handleButtonClick('right')}
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                border: 'none',
                background: 'var(--primary)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(0, 200, 5, 0.3)',
                transition: 'all 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.boxShadow = '0 12px 32px rgba(0, 200, 5, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 200, 5, 0.3)';
              }}
            >
              <ChevronRight size={28} strokeWidth={3} />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
