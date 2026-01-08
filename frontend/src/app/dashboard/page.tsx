/**
 * Dashboard Page - MacroInsight Market
 * Swipe-based news filtering interface
 */
'use client';

import React, { useState, useEffect } from 'react';
import { SwipeCardStack, NewsCard } from '@/components/dashboard/SwipeCardStack';
import { Coins, User } from 'lucide-react';
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

  const handleSwipeRight = (card: NewsCard) => {
    setSavedCards([...savedCards, card]);
    setMPoints(mPoints + 2);
    setShowPointsAnimation(true);
    setTimeout(() => setShowPointsAnimation(false), 1000);
  };

  const handleSwipeLeft = (card: NewsCard) => {
    // Just remove card, no points
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
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--background)',
      paddingTop: '5rem'
    }}>
      {/* Header with M-Points */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '5rem',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 1.5rem'
      }}>
        <h1 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 800,
          color: 'var(--text-primary)'
        }}>
          MacroInsight
        </h1>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* M-Points Badge */}
          <div className="badge-pill badge-gold" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            fontWeight: 700,
            position: 'relative'
          }}>
            <Coins size={20} />
            <span className="number-display">{mPoints}</span>
            
            {/* Points Animation */}
            <AnimatePresence>
              {showPointsAnimation && (
                <motion.div
                  initial={{ opacity: 0, y: 0, scale: 1 }}
                  animate={{ opacity: 1, y: -30, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  style={{
                    position: 'absolute',
                    top: '-1rem',
                    right: '-1rem',
                    color: 'var(--mpoints)',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    pointerEvents: 'none'
                  }}
                >
                  +2
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar */}
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}>
            <User size={20} />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        padding: '3rem 1.5rem',
        maxWidth: '640px',
        margin: '0 auto'
      }}>
        {!showEmptyState ? (
          <>
            <h2 style={{
              fontSize: '2rem',
              fontWeight: 800,
              marginBottom: '0.5rem',
              textAlign: 'center',
              color: 'var(--text-primary)'
            }}>
              The Morning Stack
            </h2>
            <p style={{
              fontSize: '1rem',
              marginBottom: '3rem',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              Lướt để lọc tin tức quan trọng
            </p>

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
            style={{ textAlign: 'center', padding: '3rem 1rem' }}
          >
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 800,
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              🎉 Hoàn thành!
            </h2>
            <p style={{
              fontSize: '1.125rem',
              marginBottom: '2rem',
              color: 'var(--text-secondary)'
            }}>
              Bạn đã lọc xong {mockNewsCards.length} tin tức
            </p>

            {/* Saved Articles List */}
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '1.5rem',
                color: 'var(--text-primary)'
              }}>
                Tiêu điểm của tôi ({savedCards.length})
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {savedCards.map((card) => (
                  <div
                    key={card.id}
                    className="card interactive-lift"
                    style={{
                      padding: '1.5rem',
                      textAlign: 'left',
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span className="badge-pill" style={{ 
                        background: 'var(--surface)',
                        fontSize: '0.75rem'
                      }}>
                        {card.tag}
                      </span>
                    </div>
                    <h4 style={{
                      fontSize: '1.125rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}>
                      {card.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Bar */}
            <div style={{
              position: 'fixed',
              bottom: '2rem',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '90%',
              maxWidth: '600px'
            }}>
              <Link href="/chat" style={{ textDecoration: 'none' }}>
                <button
                  className="btn-primary interactive-scale"
                  style={{
                    width: '100%',
                    padding: '1rem 2rem',
                    fontSize: '1rem',
                    fontWeight: 700
                  }}
                >
                  💬 Chat with AI về tiêu điểm
                </button>
              </Link>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
