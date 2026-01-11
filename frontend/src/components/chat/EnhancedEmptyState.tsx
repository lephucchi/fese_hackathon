'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Scale, TrendingUp, Newspaper, Sparkles, MessageSquarePlus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface EmptyStateProps {
  onSelectQuery: (query: string) => void;
}

export function EnhancedEmptyState({ onSelectQuery }: EmptyStateProps) {
  const { t } = useLanguage();

  const categories = [
    {
      icon: BookOpen,
      title: t('chat.emptyState.categories.terminology'),
      color: 'var(--primary)',
      bgColor: 'rgba(0, 200, 5, 0.1)',
      examples: t('chat.emptyState.examples.terminology') as string[],
    },
    {
      icon: TrendingUp,
      title: t('chat.emptyState.categories.finance'),
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
      examples: t('chat.emptyState.examples.finance') as string[],
    },
    {
      icon: Scale,
      title: t('chat.emptyState.categories.legal'),
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
      examples: t('chat.emptyState.examples.legal') as string[],
    },
    {
      icon: Newspaper,
      title: t('chat.emptyState.categories.news'),
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      examples: t('chat.emptyState.examples.news') as string[],
    },
  ];

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      maxWidth: '800px',
      margin: '0 auto',
      padding: '0 clamp(0.5rem, 2vw, 1rem)'
    }}>
      {/* Compact Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{
          textAlign: 'center',
          marginBottom: 'clamp(0.75rem, 2vw, 1.25rem)',
          padding: 'clamp(0.75rem, 2vw, 1.25rem)',
          background: 'var(--card)',
          borderRadius: '16px',
          border: '1px solid var(--border)',
          width: '100%'
        }}
      >
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '40px',
          height: '40px',
          borderRadius: '12px',
          marginBottom: '0.5rem',
          background: 'var(--primary)'
        }}>
          <MessageSquarePlus size={22} color="white" />
        </div>

        <h1 style={{
          fontSize: 'clamp(1.1rem, 3vw, 1.5rem)',
          fontWeight: 700,
          marginBottom: '0.25rem',
          background: 'linear-gradient(135deg, var(--primary) 0%, #00D906 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>
          {t('chat.emptyState.title')}
        </h1>

        <p style={{
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          color: 'var(--text-secondary)',
          margin: 0
        }}>
          {t('chat.emptyState.subtitle')}
        </p>
      </motion.div>

      {/* Compact Category Grid - 2x2 */}
      <div style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 'clamp(0.5rem, 1.5vw, 0.75rem)'
      }}>
        {categories.map((category, categoryIndex) => (
          <motion.div
            key={category.title as string}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 + categoryIndex * 0.05 }}
            style={{
              padding: 'clamp(0.625rem, 2vw, 0.875rem)',
              borderRadius: '14px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              transition: 'all 0.2s ease'
            }}
          >
            {/* Category Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem'
            }}>
              <div style={{
                width: '1.75rem',
                height: '1.75rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: category.bgColor,
                flexShrink: 0
              }}>
                <category.icon size={14} style={{ color: category.color }} />
              </div>
              <h3 style={{
                fontWeight: 600,
                fontSize: 'clamp(0.75rem, 1.8vw, 0.875rem)',
                color: 'var(--text-primary)',
                margin: 0
              }}>
                {category.title}
              </h3>
            </div>

            {/* Compact Example Queries */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
              {category.examples.map((example, i) => (
                <button
                  key={i}
                  onClick={() => onSelectQuery(example)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '0.5rem 0.625rem',
                    borderRadius: '8px',
                    fontSize: 'clamp(0.7rem, 1.6vw, 0.8rem)',
                    background: 'var(--surface)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.375rem',
                    lineHeight: 1.3
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = category.color;
                    e.currentTarget.style.color = 'var(--text-primary)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <Sparkles size={10} style={{ color: category.color, flexShrink: 0 }} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {example}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
