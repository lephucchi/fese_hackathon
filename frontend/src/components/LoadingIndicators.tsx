'use client';

import React from 'react';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export function LoadingDots({ size = 'md', color = 'var(--primary)' }: LoadingDotsProps) {
  const dotSize = size === 'sm' ? '6px' : size === 'md' ? '8px' : '10px';
  const gap = size === 'sm' ? '4px' : size === 'md' ? '6px' : '8px';

  return (
    <div className="flex items-center gap-1" style={{ gap }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-full animate-pulse"
          style={{
            width: dotSize,
            height: dotSize,
            backgroundColor: color,
            animationDelay: `${i * 0.15}s`,
          }}
        />
      ))}
    </div>
  );
}

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

export function LoadingSpinner({ size = 24, color = 'var(--primary)' }: LoadingSpinnerProps) {
  return (
    <div
      className="animate-spin rounded-full border-2 border-transparent"
      style={{
        width: size,
        height: size,
        borderTopColor: color,
        borderRightColor: color,
      }}
    />
  );
}

interface ThinkingIndicatorProps {
  message?: string;
}

export function ThinkingIndicator({ message = 'Đang phân tích...' }: ThinkingIndicatorProps) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-lg glass animate-fadeIn">
      <LoadingDots />
      <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        {message}
      </span>
    </div>
  );
}
