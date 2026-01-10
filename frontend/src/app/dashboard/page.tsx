/**
 * Dashboard Page - MacroInsight Market
 * Swipe-based news filtering interface using /api/news
 */
'use client';

import React, { useState, useEffect } from 'react';
import { CompletionScreen } from '@/components/news/CompletionScreen';
import { SavedNewsSidebar } from '@/components/news/SavedNewsSidebar';
import { Navigation } from '@/components/shared/Navigation';
import { Coins, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNewsSwipe, NewsSwipeItem } from '@/hooks/useNewsSwipe';
import { useSavedNews, SavedNewsItem } from '@/hooks/useSavedNews';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, ExternalLink, Tag } from 'lucide-react';

// News Swipe Card Component with content display
function NewsSwipeCard({
  news,
  onSwipeLeft,
  onSwipeRight,
  onCardClick,
  isTop,
  stackIndex,
  totalCards,
  exitDirection = null,
}: {
  news: NewsSwipeItem;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onCardClick?: () => void;
  isTop: boolean;
  stackIndex: number;
  totalCards: number;
  exitDirection?: 'left' | 'right' | null;
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

  const isNeutral = !isTop;

  return (
    <motion.div
      key={news.news_id}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      initial={stackIndex > 2 ? { opacity: 0, scale: 0.8 } : { opacity: 0, scale: 0.95 }}
      animate={{
        top: isTop ? 0 : stackIndex * 8,
        scale: isTop ? 1 : 1 - stackIndex * 0.05,
        opacity: isTop ? 1 : (stackIndex > 2 ? 0 : 1 - stackIndex * 0.3),
        y: 0,
      }}
      exit={{
        x: exitDirection === 'left' ? -1000 : (exitDirection === 'right' ? 1000 : (x.get() < 0 ? -1000 : 1000)),
        opacity: 0,
        rotate: exitDirection === 'left' ? -40 : (exitDirection === 'right' ? 40 : (x.get() < 0 ? -40 : 40)),
        transition: { type: 'spring', damping: 30, stiffness: 200 }
      }}
      style={{
        x,
        rotate: isTop ? rotate : 0,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        margin: '0 auto',
        width: '100%',
        maxWidth: '420px',
        height: '520px',
        background: 'var(--card)',
        borderRadius: '24px',
        boxShadow: isTop ? 'var(--shadow-xl)' : 'var(--shadow-lg)',
        cursor: isTop ? 'grab' : 'default',
        zIndex: totalCards - stackIndex,
        overflow: 'hidden',
      }}
      onDragEnd={isTop ? handleDragEnd : undefined}
      whileTap={isTop ? { cursor: 'grabbing' } : undefined}
      onTap={isTop ? () => onCardClick?.() : undefined}
    >
      {isTop && (
        <>
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
                  {news.keywords.slice(0, 2).map((keyword) => (
                    <span
                      key={keyword}
                      style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-tertiary)',
                        background: 'var(--surface)',
                        padding: '0.125rem 0.375rem',
                        borderRadius: '4px'
                      }}
                    >
                      #{keyword}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}

export default function DashboardPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { stack, loading, error, remaining, swipeRight, swipeLeft, refetch, savedCount, total } = useNewsSwipe(20);
  const { savedNews, loading: savedLoading, total: savedTotal, addOptimisticNews } = useSavedNews();

  const [mPoints, setMPoints] = useState(650);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [pointsEarnedToday, setPointsEarnedToday] = useState(0);
  const [selectedNews, setSelectedNews] = useState<NewsSwipeItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lastDirection, setLastDirection] = useState<'left' | 'right' | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  const handleSwipeRight = async (newsId: string) => {
    setLastDirection('right');
    // Find the news item being saved
    const newsItem = stack.find(n => n.news_id === newsId);

    await swipeRight(newsId);
    setMPoints(mPoints + 2);
    setPointsEarnedToday(pointsEarnedToday + 2);
    setShowPointsAnimation(true);
    setCurrentCardIndex(currentCardIndex + 1);
    setTimeout(() => setShowPointsAnimation(false), 1000);

    // Optimistically add to saved news sidebar
    if (newsItem) {
      const savedItem: SavedNewsItem = {
        news_id: newsItem.news_id,
        title: newsItem.title,
        content: newsItem.content,
        source_url: newsItem.source_url,
        published_at: newsItem.published_at,
        sentiment: newsItem.sentiment,
        analyst: null,
        tickers: newsItem.tickers.map(t => ({ ticker: t, confidence: null }))
      };
      addOptimisticNews(savedItem);

      // Auto-open sidebar when first news is saved
      if (savedTotal === 0) {
        setSidebarOpen(true);
      }
    }
  };

  const handleSwipeLeft = async (newsId: string) => {
    setLastDirection('left');
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
            {/* Left Button - Skip */}
            <motion.button
              whileHover={{ scale: 1.1, backgroundColor: 'var(--error)', color: '#fff' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleButtonClick('left')}
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                border: '2px solid var(--error)',
                background: 'var(--card)',
                color: 'var(--error)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(231, 76, 60, 0.2)',
                transition: 'box-shadow 0.2s, background-color 0.2s, color 0.2s',
                flexShrink: 0
              }}
            >
              <ChevronLeft size={32} strokeWidth={2.5} />
            </motion.button>

            {/* Card Stack */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '420px',
              height: '550px' // Fixed height for stack
            }}>
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
              <AnimatePresence initial={false}>
                {stack.length > 0 && (
                  <NewsSwipeCard
                    key={stack[0].news_id}
                    news={stack[0]}
                    onSwipeLeft={() => handleSwipeLeft(stack[0].news_id)}
                    onSwipeRight={() => handleSwipeRight(stack[0].news_id)}
                    onCardClick={() => setSelectedNews(stack[0])}
                    isTop={true}
                    stackIndex={0}
                    totalCards={stack.length}
                    exitDirection={lastDirection}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Right Button - Save */}
            {/* Right Button - Save */}
            <motion.button
              whileHover={{ scale: 1.1, boxShadow: '0 12px 32px rgba(0, 200, 5, 0.4)' }}
              whileTap={{ scale: 0.9 }}
              onClick={() => handleButtonClick('right')}
              style={{
                width: '64px',
                height: '64px',
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
            >
              <ChevronRight size={32} strokeWidth={2.5} />
            </motion.button>
          </div>
        )}
      </main>

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
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--card)',
                borderRadius: '24px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '85vh',
                overflow: 'hidden',
                position: 'relative',
                boxShadow: 'var(--shadow-xl)'
              }}
            >
              {/* Close Button */}
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
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--error)';
                  e.currentTarget.style.color = 'white';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
              >
                ×
              </button>

              {/* Modal Content */}
              <div style={{ padding: '2rem', overflow: 'auto', maxHeight: '85vh' }}>
                {/* Sentiment Badge */}
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.375rem 0.75rem',
                  borderRadius: '8px',
                  background: selectedNews.sentiment?.toLowerCase() === 'positive'
                    ? 'rgba(46, 204, 113, 0.15)'
                    : selectedNews.sentiment?.toLowerCase() === 'negative'
                      ? 'rgba(231, 76, 60, 0.15)'
                      : 'rgba(243, 156, 18, 0.15)',
                  marginBottom: '1rem'
                }}>
                  {selectedNews.sentiment?.toLowerCase() === 'positive' && <TrendingUp size={16} color="#2ECC71" />}
                  {selectedNews.sentiment?.toLowerCase() === 'negative' && <TrendingDown size={16} color="#E74C3C" />}
                  {(!selectedNews.sentiment || selectedNews.sentiment?.toLowerCase() === 'neutral') && <Minus size={16} color="#F39C12" />}
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: selectedNews.sentiment?.toLowerCase() === 'positive'
                      ? '#2ECC71'
                      : selectedNews.sentiment?.toLowerCase() === 'negative'
                        ? '#E74C3C'
                        : '#F39C12',
                    textTransform: 'uppercase'
                  }}>
                    {selectedNews.sentiment?.toLowerCase() === 'positive' ? 'Tích cực'
                      : selectedNews.sentiment?.toLowerCase() === 'negative' ? 'Tiêu cực'
                        : 'Trung lập'}
                  </span>
                </div>

                {/* Title */}
                <h2 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: '1rem',
                  lineHeight: 1.4,
                  paddingRight: '2rem'
                }}>
                  {selectedNews.title}
                </h2>

                {/* Tickers & Date */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap'
                }}>
                  {selectedNews.tickers.map((ticker) => (
                    <span
                      key={ticker}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Tag size={12} />
                      {ticker}
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

                {/* Full Content */}
                <div style={{
                  fontSize: '1rem',
                  lineHeight: 1.8,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'pre-wrap',
                  marginBottom: '1.5rem'
                }}>
                  {selectedNews.content || 'Không có nội dung chi tiết'}
                </div>

                {/* Keywords */}
                {selectedNews.keywords.length > 0 && (
                  <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    flexWrap: 'wrap',
                    marginBottom: '1.5rem'
                  }}>
                    {selectedNews.keywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-tertiary)',
                          background: 'var(--surface)',
                          padding: '0.375rem 0.625rem',
                          borderRadius: '6px'
                        }}
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)'
                }}>
                  {selectedNews.source_url && (
                    <a
                      href={selectedNews.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '10px',
                        textDecoration: 'none',
                        fontWeight: 600,
                        fontSize: '0.9rem'
                      }}
                    >
                      Đọc bài gốc <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedNews(null)}
                    style={{
                      padding: '0.75rem 1.5rem',
                      background: 'var(--surface)',
                      color: 'var(--text-primary)',
                      border: '1px solid var(--border)',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.9rem'
                    }}
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Saved News Sidebar */}
      <SavedNewsSidebar
        savedNews={savedNews}
        loading={savedLoading}
        total={savedTotal}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onNewsClick={(news) => {
          // Convert SavedNewsItem to NewsSwipeItem format for detail modal
          setSelectedNews({
            news_id: news.news_id,
            title: news.title,
            content: news.content,
            sentiment: news.sentiment,
            sentiment_color: '',
            keywords: [],
            tickers: news.tickers.map(t => t.ticker),
            published_at: news.published_at,
            source_url: news.source_url
          });
        }}
      />
    </div>
  );
}
