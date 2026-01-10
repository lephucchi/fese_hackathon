'use client';

import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface LanguageToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LanguageToggle({ showLabel = true, size = 'md' }: LanguageToggleProps) {
  const { language, setLanguage } = useLanguage();

  const sizeStyles = {
    sm: { padding: '0.375rem 0.5rem', iconSize: 14, fontSize: '0.75rem' },
    md: { padding: '0.5rem 0.75rem', iconSize: 16, fontSize: '0.875rem' },
    lg: { padding: '0.625rem 1rem', iconSize: 18, fontSize: '1rem' },
  };

  const currentSize = sizeStyles[size];

  const toggleLanguage = () => {
    setLanguage(language === 'vi' ? 'en' : 'vi');
  };

  return (
    <button
      onClick={toggleLanguage}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: currentSize.padding,
        borderRadius: '0.5rem',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        cursor: 'pointer',
        transition: 'all 0.2s',
        fontSize: currentSize.fontSize,
        fontWeight: 600,
        color: 'var(--text-secondary)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.05)';
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.color = 'var(--primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      aria-label={`Switch to ${language === 'vi' ? 'English' : 'Vietnamese'}`}
      title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
    >
      <Globe size={currentSize.iconSize} />
      {showLabel && (
        <span className="hidden-sm">
          {language === 'vi' ? 'EN' : 'VN'}
        </span>
      )}
    </button>
  );
}

export default LanguageToggle;
