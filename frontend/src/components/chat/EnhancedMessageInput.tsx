'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useIsMobile } from '@/hooks/useIsMobile';

interface EnhancedMessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function EnhancedMessageInput({ onSend, disabled = false }: EnhancedMessageInputProps) {
  const { t } = useLanguage();
  const isMobile = useIsMobile();
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = '0px';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = Math.min(scrollHeight, 150) + 'px';
    }
  }, [input]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !disabled) {
      onSend(input.trim());
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Input Container */}
      <form onSubmit={handleSubmit}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.75rem',
            padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1rem, 3vw, 1.25rem)',
            borderRadius: '20px',
            background: 'var(--card)',
            border: isFocused ? '2px solid var(--primary)' : '2px solid var(--border)',
            transition: 'all 0.3s ease',
            boxShadow: isFocused ? '0 4px 20px rgba(0, 200, 5, 0.15)' : 'var(--shadow-sm)'
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={t('chat.input.placeholder') as string}
            disabled={disabled}
            rows={1}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              minHeight: '28px',
              maxHeight: '150px',
              fontSize: 'clamp(0.9rem, 2vw, 1rem)',
              lineHeight: 1.5,
              color: 'var(--text-primary)',
              padding: '0.25rem 0'
            }}
          />

          {/* Right Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end', paddingBottom: '0.25rem' }}>
            {/* Character Count - hide on mobile */}
            {!isMobile && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.375rem 0.625rem',
                borderRadius: '10px',
                background: 'var(--surface)',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: 'var(--text-tertiary)',
                border: '1px solid var(--border)'
              }}>
                <span>{input.length}</span>
              </div>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              style={{
                flexShrink: 0,
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: input.trim() && !disabled ? 'var(--primary)' : 'var(--surface)',
                opacity: input.trim() && !disabled ? 1 : 0.5,
                cursor: input.trim() && !disabled ? 'pointer' : 'not-allowed',
                boxShadow: input.trim() && !disabled ? '0 4px 12px rgba(0, 200, 5, 0.3)' : 'none',
                border: input.trim() && !disabled ? 'none' : '1px solid var(--border)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (input.trim() && !disabled) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 200, 5, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = input.trim() && !disabled ? '0 4px 12px rgba(0, 200, 5, 0.3)' : 'none';
              }}
            >
              <Send size={20} style={{ color: input.trim() && !disabled ? 'white' : 'var(--text-tertiary)' }} />
            </button>
          </div>
        </div>
      </form>

      {/* Hints Row - hide on mobile */}
      {!isMobile && (
        <div style={{
          marginTop: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          padding: '0 0.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)' }}>
            <kbd style={{
              padding: '0.125rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: 'var(--surface)',
              border: '1px solid var(--border)'
            }}>Enter</kbd>
            <span>{t('chat.input.enterToSend')}</span>
            <span style={{ opacity: 0.3 }}>•</span>
            <kbd style={{
              padding: '0.125rem 0.5rem',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: 600,
              background: 'var(--surface)',
              border: '1px solid var(--border)'
            }}>Shift+Enter</kbd>
            <span>{t('chat.input.shiftEnter')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)' }}>
            <Sparkles size={12} style={{ color: 'var(--primary)' }} />
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', animation: 'pulse 2s ease-in-out infinite' }} />
            <span style={{ fontWeight: 500 }}>{t('chat.input.aiReady')}</span>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
        }
      `}</style>
    </div>
  );
}
