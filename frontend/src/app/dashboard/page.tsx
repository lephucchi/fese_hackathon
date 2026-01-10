/**
 * Dashboard Page - MacroInsight Market
 * Swipe-based news filtering interface
 */
'use client';

import React, { useState, useEffect } from 'react';
import { SwipeCardStack, NewsCard } from '@/components/news/SwipeCardStack';
import { CompletionScreen } from '@/components/news/CompletionScreen';
import { Navigation } from '@/components/shared/Navigation';
import { Coins, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMarketStack } from '@/hooks/useMarketStack';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { stack, loading, error, remaining, swipeRight, swipeLeft, refetch, savedCount } = useMarketStack(20);

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

  // Convert API NewsStackItem to NewsCard format
  const cards: NewsCard[] = stack.map((item) => {
    const sentiment = item.sentiment?.toLowerCase();
    return {
      id: item.news_id,
      title: item.title,
      tag: item.keywords[0] ? `#${item.keywords[0]}` : '#News',
      sentiment: (sentiment === 'positive' || sentiment === 'negative' ? sentiment : 'neutral') as 'positive' | 'negative' | 'neutral',
      summary: `${item.tickers.join(', ')} • ${item.published_at || 'Mới nhất'}`,
    };
  });

  const handleSwipeRight = async (card: NewsCard) => {
    await swipeRight(card.id);
    setMPoints(mPoints + 2);
    setPointsEarnedToday(pointsEarnedToday + 2);
    setShowPointsAnimation(true);
    setCurrentCardIndex(currentCardIndex + 1);
    setTimeout(() => setShowPointsAnimation(false), 1000);
  };

  const handleSwipeLeft = async (card: NewsCard) => {
    await swipeLeft(card.id);
    setCurrentCardIndex(currentCardIndex + 1);
  };

  const handleStackEmpty = () => {
    // Stack is empty, show completion screen
  };

  const handleRefresh = () => {
    refetch();
    setCurrentCardIndex(0);
    setPointsEarnedToday(0);
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
              animate={{ width: `${stack.length > 0 ? ((20 - stack.length) / 20) * 100 : 100}%` }}
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
            {20 - stack.length}/20
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
            The Morning Stack
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'var(--text-secondary)'
          }}>
            <Sparkles size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
            Lướt để lọc tin tức quan trọng
          </p>
        </div>

        {cards.length === 0 ? (
          <CompletionScreen
            totalCards={currentCardIndex}
            savedCount={savedCount}
            pointsEarned={pointsEarnedToday}
            onRefresh={handleRefresh}
          />
        ) : (
          <>
            <SwipeCardStack
              cards={cards}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onStackEmpty={handleStackEmpty}
            />
          </>
        )}
      </main>
    </div>
  );
}
