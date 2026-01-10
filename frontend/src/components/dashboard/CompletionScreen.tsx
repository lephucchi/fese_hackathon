'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { MessageSquare, RefreshCw, TrendingUp } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CompletionScreenProps {
  totalCards: number;
  savedCount: number;
  pointsEarned: number;
  onRefresh: () => void;
}

export function CompletionScreen({
  totalCards,
  savedCount,
  pointsEarned,
  onRefresh,
}: CompletionScreenProps) {
  const router = useRouter();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ textAlign: 'center', padding: '2rem 0' }}
    >
      {/* Completion Icon */}
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
          boxShadow: '0 8px 32px rgba(0, 200, 5, 0.3)',
        }}
      >
        🎉
      </motion.div>

      <h2
        style={{
          fontSize: '1.75rem',
          fontWeight: 800,
          marginBottom: '0.5rem',
          color: 'var(--text-primary)',
        }}
      >
        Hoàn thành buổi sáng!
      </h2>

      <p
        style={{
          fontSize: '1rem',
          color: 'var(--text-secondary)',
          marginBottom: '2rem',
        }}
      >
        Bạn đã lọc xong {totalCards} tin tức
      </p>

      {/* Stats Summary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--primary)',
            }}
          >
            {totalCards}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Tin đã lọc
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#4ADE80',
            }}
          >
            {savedCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Đã lưu
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 800,
              color: '#FFC107',
            }}
          >
            +{pointsEarned}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            M-Points
          </div>
        </div>
      </div>

      {/* CTA Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
        {savedCount > 0 && (
          <button
            onClick={() => router.push('/chat?mode=context')}
            className="interactive-scale"
            style={{
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: 600,
              borderRadius: '12px',
              border: 'none',
              background: 'var(--primary)',
              color: 'white',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 16px rgba(0, 200, 5, 0.25)',
            }}
          >
            <MessageSquare size={20} />
            💬 Chat với {savedCount} tin đã chọn
          </button>
        )}

        <button
          onClick={onRefresh}
          className="interactive-scale"
          style={{
            padding: '1rem 2rem',
            fontSize: '1rem',
            fontWeight: 600,
            borderRadius: '12px',
            border: '1.5px solid var(--border)',
            background: 'var(--card)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <RefreshCw size={20} />
          Làm mới stack
        </button>
      </div>

      {savedCount > 0 && (
        <p
          style={{
            marginTop: '1.5rem',
            fontSize: '0.875rem',
            color: 'var(--text-tertiary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
          }}
        >
          <TrendingUp size={16} />
          Context đã được build và cache sẵn ⚡
        </p>
      )}
    </motion.div>
  );
}
