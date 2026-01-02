'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Scale, TrendingUp, Newspaper, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onSelectQuery: (query: string) => void;
}

const categories = [
  {
    icon: BookOpen,
    title: 'Thuật ngữ',
    color: '#6366f1',
    examples: ['ROE là gì?', 'EPS được tính như thế nào?'],
  },
  {
    icon: TrendingUp,
    title: 'Tài chính',
    color: '#10b981',
    examples: ['Báo cáo tài chính VNM', 'Lợi nhuận FPT năm nay'],
  },
  {
    icon: Scale,
    title: 'Pháp lý',
    color: '#8b5cf6',
    examples: ['Điều 10 Luật Doanh nghiệp', 'Quy định công ty cổ phần'],
  },
  {
    icon: Newspaper,
    title: 'Tin tức',
    color: '#f59e0b',
    examples: ['Tin VN-Index hôm nay', 'Thị trường chứng khoán'],
  },
];

export function EnhancedEmptyState({ onSelectQuery }: EmptyStateProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100%', padding: '2rem 1rem' }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ textAlign: 'center', marginBottom: '2rem' }}
      >
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '3.5rem', height: '3.5rem', borderRadius: '1rem', marginBottom: '1rem', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' }}>
          <Sparkles size={28} color="white" />
        </div>
        <h2 style={{ fontSize: 'clamp(1.25rem, 3vw, 1.5rem)', fontWeight: 700, marginBottom: '0.5rem' }} className="text-gradient">
          Multi-Index RAG
        </h2>
        <p style={{ fontSize: 'clamp(0.875rem, 2vw, 1rem)', color: 'var(--text-secondary)' }}>
          Hỏi về tài chính, pháp lý hoặc thị trường Việt Nam
        </p>
      </motion.div>

      {/* Category Grid */}
      <div style={{ width: '100%', maxWidth: '42rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {categories.map((category, categoryIndex) => (
          <motion.div
            key={category.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: categoryIndex * 0.1 }}
            style={{ padding: '1rem', borderRadius: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${category.color}20` }}>
                <category.icon size={16} style={{ color: category.color }} />
              </div>
              <h3 style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                {category.title}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {category.examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuery(example)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem',
                    background: 'var(--background)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
