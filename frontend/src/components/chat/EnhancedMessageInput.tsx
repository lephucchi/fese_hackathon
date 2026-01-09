'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Zap, Sparkles, Search, Paperclip, Smile, MoreVertical } from 'lucide-react';

interface QueryMode {
  id: 'fast' | 'standard' | 'deep';
  label: string;
  icon: React.ReactNode;
  description: string;
}

const queryModes: QueryMode[] = [
  { id: 'fast', label: 'Fast', icon: <Zap size={14} />, description: 'Quick answers' },
  { id: 'standard', label: 'Standard', icon: <Sparkles size={14} />, description: 'Balanced quality' },
  { id: 'deep', label: 'Deep', icon: <Search size={14} />, description: 'Detailed analysis' },
];

interface EnhancedMessageInputProps {
  onSend: (message: string, mode: 'fast' | 'standard' | 'deep') => void;
  disabled?: boolean;
}

export function EnhancedMessageInput({ onSend, disabled = false }: EnhancedMessageInputProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'fast' | 'standard' | 'deep'>('standard');
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
      onSend(input.trim(), mode);
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
      {/* Mode Selector with Descriptions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
        {queryModes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', fontSize: '0.75rem', fontWeight: 500, background: mode === m.id ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--surface)', color: mode === m.id ? 'white' : 'var(--text-secondary)', border: mode === m.id ? 'none' : '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s', boxShadow: mode === m.id ? 'var(--shadow-md)' : 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = mode === m.id ? 'var(--shadow-md)' : 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '0.125rem' }}>
              {m.icon}
              <span style={{ fontWeight: 600 }}>{m.label}</span>
            </div>
            <span style={{ fontSize: '0.625rem', opacity: mode === m.id ? 0.9 : 0.7 }}>{m.description}</span>
          </button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit}>
        <div
          style={{ display: 'flex', alignItems: 'flex-end', gap: '0.75rem', padding: '1rem', borderRadius: '1rem', background: 'var(--surface)', border: '2px solid var(--border)', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.1)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'var(--shadow-sm)'; }}
        >
          {/* Left Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.25rem' }}>
            <button
              type="button"
              style={{ padding: '0.375rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Attach file (Coming soon)"
            >
              <Paperclip size={18} style={{ color: 'var(--text-tertiary)' }} />
            </button>
            <button
              type="button"
              style={{ padding: '0.375rem', borderRadius: '0.5rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--background)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Emoji (Coming soon)"
            >
              <Smile size={18} style={{ color: 'var(--text-tertiary)' }} />
            </button>
          </div>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about Vietnamese finance, legal matters, or market trends..."
            disabled={disabled}
            rows={1}
            className="dark:text-white text-gray-900"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', resize: 'none', minHeight: '24px', maxHeight: '150px', fontSize: 'clamp(0.875rem, 2vw, 1rem)', lineHeight: 1.5 }}
          />

          {/* Right Actions */}
          <div style={{ display: 'flex', gap: '0.5rem', paddingBottom: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '0.5rem', background: 'var(--background)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <span>{input.length}</span>
            </div>
            <button
              type="submit"
              disabled={!input.trim() || disabled}
              style={{ flexShrink: 0, width: '2.5rem', height: '2.5rem', borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: input.trim() && !disabled ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--border)', opacity: input.trim() && !disabled ? 1 : 0.5, cursor: input.trim() && !disabled ? 'pointer' : 'not-allowed', boxShadow: input.trim() && !disabled ? 'var(--shadow-md)' : 'none', border: 'none', transition: 'all 0.2s' }}
              onMouseEnter={(e) => { if (input.trim() && !disabled) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; } }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = input.trim() && !disabled ? 'var(--shadow-md)' : 'none'; }}
            >
              <Send size={18} style={{ color: 'white' }} />
            </button>
          </div>
        </div>
      </form>

      {/* Hint */}
      <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-tertiary)' }}>
          <kbd style={{ padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>Enter</kbd> to send
          <span style={{ opacity: 0.5 }}>•</span>
          <kbd style={{ padding: '0.125rem 0.375rem', borderRadius: '0.25rem', fontSize: '0.75rem', background: 'var(--surface)', border: '1px solid var(--border)' }}>Shift+Enter</kbd> for new line
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', color: 'var(--text-tertiary)' }}>
          <div style={{ width: '0.375rem', height: '0.375rem', borderRadius: '9999px', background: '#10b981' }} />
          <span>AI Ready</span>
        </div>
      </div>
    </div>
  );
}
