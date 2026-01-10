'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Brain, Database, Sparkles, Search } from 'lucide-react';
import { ThinkingStep } from '@/hooks/useContextChatStream';
import { useLanguage } from '@/contexts/LanguageContext';

interface ThinkingProcessProps {
  steps: ThinkingStep[];
  isActive: boolean;
}

const stepIcons: Record<string, React.ReactNode> = {
  fetch_interests: <Database size={16} />,
  interests_loaded: <CheckCircle size={16} />,
  build_context: <Brain size={16} />,
  context_ready: <CheckCircle size={16} />,
  query_llm: <Sparkles size={16} />,
  start: <Search size={16} />,
};

const stepColors: Record<string, string> = {
  fetch_interests: 'var(--primary)',
  interests_loaded: '#4ADE80',
  build_context: 'var(--primary)',
  context_ready: '#4ADE80',
  query_llm: 'var(--primary)',
  start: 'var(--primary)',
};

export function ThinkingProcess({ steps, isActive }: ThinkingProcessProps) {
  const { t } = useLanguage();
  
  if (steps.length === 0 && !isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        padding: '1rem',
        background: 'var(--surface)',
        borderRadius: '12px',
        border: '1px solid var(--border)',
        marginBottom: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Loader2
          size={18}
          style={{
            color: 'var(--primary)',
            animation: isActive ? 'spin 1s linear infinite' : 'none',
          }}
        />
        <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
          {t('chat.thinking.title')}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <AnimatePresence>
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
                background: 'var(--card)',
                borderRadius: '8px',
              }}
            >
              <span style={{ color: step.step ? stepColors[step.step] : 'var(--primary)' }}>
                {step.step && stepIcons[step.step]}
              </span>
              <span>{step.message}</span>
              {step.count !== undefined && (
                <span
                  style={{
                    marginLeft: 'auto',
                    fontWeight: 600,
                    color: 'var(--primary)',
                    fontSize: '0.75rem',
                    padding: '0.125rem 0.5rem',
                    background: 'rgba(0, 200, 5, 0.1)',
                    borderRadius: '12px',
                  }}
                >
                  {step.count} tin
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
