/**
 * Dashboard Page - MacroInsight Market
 * Swipe-based news filtering interface
 */
'use client';

import React, { useState, useEffect } from 'react';
import { SwipeCardStack, NewsCard } from '@/components/dashboard/SwipeCardStack';
import { Navigation } from '@/components/shared/Navigation';
import { Coins, MessageSquare, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const mockNewsCards: NewsCard[] = [
  {
    id: '1',
    title: 'FED giữ nguyên lãi suất, thị trường tăng điểm mạnh',
    tag: '#Macro',
    sentiment: 'positive',
    summary: 'Cục Dự trữ Liên bang Mỹ (FED) quyết định giữ nguyên lãi suất trong phiên họp tháng này. Động thái này được thị trường đón nhận tích cực với chỉ số S&P 500 tăng 1.5%.'
  },
  {
    id: '2',
    title: 'NHNN cắt giảm lãi suất điều hành 0.5%',
    tag: '#Banking',
    sentiment: 'positive',
    summary: 'Ngân hàng Nhà nước Việt Nam thông báo giảm lãi suất điều hành xuống 0.5%, tạo điều kiện thuận lợi cho doanh nghiệp tiếp cận vốn vay.'
  },
  {
    id: '3',
    title: 'Giá dầu tăng mạnh do căng thẳng Trung Đông',
    tag: '#Commodity',
    sentiment: 'negative',
    summary: 'Giá dầu thô Brent tăng vượt 90 USD/thùng do lo ngại về nguồn cung từ khu vực Trung Đông. Điều này có thể gây áp lực lạm phát toàn cầu.'
  },
  {
    id: '4',
    title: 'Chứng khoán Việt Nam dẫn đầu ASEAN về tăng trưởng',
    tag: '#Market',
    sentiment: 'positive',
    summary: 'VN-Index ghi nhận mức tăng 28% từ đầu năm, vượt xa các thị trường khác trong khu vực ASEAN nhờ dòng tiền ngoại mạnh.'
  },
  {
    id: '5',
    title: 'Lạm phát Mỹ tăng 4.2%, vượt dự báo',
    tag: '#Macro',
    sentiment: 'negative',
    summary: 'Chỉ số CPI tháng trước của Mỹ tăng 4.2%, cao hơn mức dự báo 3.9%, làm dấy lên lo ngại FED sẽ phải tiếp tục thắt chặt chính sách tiền tệ.'
  }
];

export default function DashboardPage() {
  const [cards, setCards] = useState<NewsCard[]>(mockNewsCards);
  const [savedCards, setSavedCards] = useState<NewsCard[]>([]);
  const [mPoints, setMPoints] = useState(650);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [showPointsAnimation, setShowPointsAnimation] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [pointsEarnedToday, setPointsEarnedToday] = useState(0);

  const handleSwipeRight = (card: NewsCard) => {
    setSavedCards([...savedCards, card]);
    setMPoints(mPoints + 2);
    setPointsEarnedToday(pointsEarnedToday + 2);
    setShowPointsAnimation(true);
    setCurrentCardIndex(currentCardIndex + 1);
    setTimeout(() => setShowPointsAnimation(false), 1000);
  };

  const handleSwipeLeft = (card: NewsCard) => {
    setCurrentCardIndex(currentCardIndex + 1);
  };

  const handleStackEmpty = () => {
    setShowEmptyState(true);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        // Trigger left swipe
      } else if (e.key === 'ArrowRight') {
        // Trigger right swipe
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ paddingTop: '80px', padding: '80px 1.5rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        {/* Progress Bar */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginBottom: '1.5rem',
          padding: '1rem',
          background: 'var(--card)',
          borderRadius: '12px',
          border: '1px solid var(--border)'
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
              animate={{ width: `${(currentCardIndex / mockNewsCards.length) * 100}%` }}
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
            {currentCardIndex}/{mockNewsCards.length}
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

        {!showEmptyState ? (
          <>

            <SwipeCardStack
              cards={cards}
              onSwipeLeft={handleSwipeLeft}
              onSwipeRight={handleSwipeRight}
              onStackEmpty={handleStackEmpty}
            />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', padding: '2rem 0' }}
          >
            {/* Completion Header */}
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--primary) 0%, #4ADE80 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                fontSize: '2.5rem',
                boxShadow: '0 8px 32px rgba(0, 200, 5, 0.3)'
              }}
            >
              🎉
            </motion.div>

            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              Hoàn thành buổi sáng!
            </h2>

            {/* Stats Summary */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              marginTop: '1.5rem',
              marginBottom: '2rem'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: 'var(--primary)'
                }}>
                  {mockNewsCards.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Tin đã lọc
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#4ADE80'
                }}>
                  {savedCards.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Đã lưu
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#FFC107'
                }}>
                  +{pointsEarnedToday}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  M-Points
                </div>
              </div>
            </div>

            {/* Saved Articles List */}
            {savedCards.length > 0 && (
              <div style={{ marginTop: '2rem', textAlign: 'left' }}>
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '1rem',
                  color: 'var(--text-secondary)'
                }}>
                  📌 Tiêu điểm của bạn
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {savedCards.map((card, index) => (
                    <motion.div
                      key={card.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      style={{
                        padding: '1rem',
                        background: 'var(--card)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          fontSize: '0.625rem',
                          padding: '0.25rem 0.5rem',
                          background: 'var(--surface)',
                          borderRadius: '4px',
                          color: 'var(--text-tertiary)'
                        }}>
                          {card.tag}
                        </span>
                      </div>
                      <h4 style={{
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4
                      }}>
                        {card.title}
                      </h4>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div style={{ marginTop: '2rem' }}>
              <Link href="/chat" style={{ textDecoration: 'none' }}>
                <button
                  className="btn-primary interactive-scale"
                  style={{
                    padding: '1rem 2rem',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    borderRadius: '9999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <MessageSquare size={18} />
                  Chat với AI về tiêu điểm
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
