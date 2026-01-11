'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle, Brain, Database, Sparkles, Search, FileText, Globe, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { ThinkingStep } from '@/hooks/useContextChatStream';
import { useLanguage } from '@/contexts/LanguageContext';

interface ThinkingProcessProps {
  steps: ThinkingStep[];
  isActive: boolean;
}

// Icons for each pipeline step
const stepIcons: Record<string, React.ReactNode> = {
  start: <Search size={14} />,
  context: <Database size={14} />,
  route: <Brain size={14} />,
  decompose: <FileText size={14} />,
  retrieve: <Database size={14} />,
  fallback_check: <Search size={14} />,
  google_search: <Globe size={14} />,
  extract_facts: <Zap size={14} />,
  synthesize: <Sparkles size={14} />,
  generate: <Sparkles size={14} />,
};

// Colors based on status
const getStepColor = (status?: string) => {
  if (status === 'done') return '#4ADE80';
  if (status === 'running') return 'var(--primary)';
  return 'var(--text-tertiary)';
};

// Step labels in Vietnamese
const stepLabels: Record<string, string> = {
  start: 'Khởi động',
  context: 'Tải context',
  route: 'Phân loại',
  decompose: 'Phân tích',
  retrieve: 'Tìm kiếm',
  fallback_check: 'Kiểm tra',
  google_search: 'Web search',
  extract_facts: 'Trích xuất',
  synthesize: 'Tổng hợp',
  generate: 'Tạo câu trả lời',
};

export function ThinkingProcess({ steps, isActive }: ThinkingProcessProps) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (steps.length === 0 && !isActive) return null;

  // Calculate total time from all steps
  const totalTime = steps.reduce((sum, step) => sum + (step.elapsed_ms || 0), 0);
  const completedSteps = steps.filter(s => s.status === 'done').length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      style={{
        padding: '0.75rem',
        background: 'rgba(var(--surface-rgb), 0.6)',
        backdropFilter: 'blur(8px)',
        borderRadius: '10px',
        border: '1px solid rgba(var(--border-rgb), 0.5)',
        marginBottom: '0.75rem',
        opacity: isActive ? 1 : 0.85,
      }}
    >
      {/* Header - Always visible, clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isActive ? (
            <Loader2
              size={14}
              style={{
                color: 'var(--primary)',
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : (
            <CheckCircle size={14} style={{ color: '#4ADE80' }} />
          )}
          <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>
            {isActive ? '🧠 Đang suy nghĩ...' : '✅ Hoàn thành'}
          </span>
          
          {/* Summary badges */}
          <span style={{
            fontSize: '0.7rem',
            padding: '0.125rem 0.4rem',
            background: 'var(--background)',
            borderRadius: '10px',
            color: 'var(--text-tertiary)',
          }}>
            {completedSteps}/{steps.length} bước
          </span>
          
          {totalTime > 0 && (
            <span style={{
              fontSize: '0.7rem',
              padding: '0.125rem 0.4rem',
              background: 'var(--background)',
              borderRadius: '10px',
              color: 'var(--text-tertiary)',
            }}>
              {totalTime >= 1000 ? `${(totalTime / 1000).toFixed(1)}s` : `${totalTime}ms`}
            </span>
          )}
        </div>
        
        {/* Expand/Collapse button */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem',
          color: 'var(--text-tertiary)',
          fontSize: '0.75rem',
        }}>
          <span>{isExpanded ? 'Thu gọn' : 'Mở rộng'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Expandable content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', marginTop: '0.625rem' }}>
              <AnimatePresence mode="popLayout">
                {steps.map((step, index) => (
                  <motion.div
                    key={`${step.step}-${index}`}
                    initial={{ opacity: 0, x: -10, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.4rem 0.6rem',
                      fontSize: '0.75rem',
                      color: 'var(--text-secondary)',
                      background: step.status === 'running' ? 'rgba(0, 200, 5, 0.05)' : 'rgba(var(--card-rgb), 0.5)',
                      borderRadius: '6px',
                      border: step.status === 'running' ? '1px solid var(--primary)' : '1px solid transparent',
                    }}
                  >
                    {/* Status icon */}
                    <span style={{ 
                      color: getStepColor(step.status),
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      {step.status === 'running' ? (
                        <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : step.status === 'done' ? (
                        <CheckCircle size={12} />
                      ) : (
                        step.step && stepIcons[step.step]
                      )}
                    </span>
                    
                    {/* Step label */}
                    <span style={{ 
                      fontWeight: 500,
                      color: step.status === 'done' ? 'var(--text-primary)' : 'var(--text-secondary)',
                      minWidth: '60px',
                      fontSize: '0.75rem',
                    }}>
                      {step.step ? stepLabels[step.step] || step.step : 'Step'}
                    </span>
                    
                    {/* Message - truncated */}
                    <span style={{ 
                      flex: 1, 
                      color: 'var(--text-tertiary)',
                      fontSize: '0.7rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {step.message}
                    </span>
                    
                    {/* Elapsed time badge */}
                    {step.elapsed_ms !== undefined && step.elapsed_ms > 0 && (
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          background: 'var(--background)',
                          borderRadius: '8px',
                          color: 'var(--text-tertiary)',
                        }}
                      >
                        {step.elapsed_ms >= 1000 
                          ? `${(step.elapsed_ms / 1000).toFixed(1)}s`
                          : `${step.elapsed_ms}ms`
                        }
                      </span>
                    )}
                    
                    {/* Additional data badges */}
                    {step.data?.routes && (
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          background: 'rgba(0, 200, 5, 0.1)',
                          borderRadius: '8px',
                          color: 'var(--primary)',
                        }}
                      >
                        {step.data.routes.join(', ')}
                      </span>
                    )}
                    
                    {step.data?.doc_count !== undefined && (
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          background: 'rgba(59, 130, 246, 0.1)',
                          borderRadius: '8px',
                          color: '#3B82F6',
                        }}
                      >
                        {step.data.doc_count} docs
                      </span>
                    )}
                    
                    {step.data?.fact_count !== undefined && (
                      <span
                        style={{
                          fontWeight: 500,
                          fontSize: '0.65rem',
                          padding: '0.1rem 0.35rem',
                          background: 'rgba(234, 179, 8, 0.1)',
                          borderRadius: '8px',
                          color: '#EAB308',
                        }}
                      >
                        {step.data.fact_count} facts
                      </span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
