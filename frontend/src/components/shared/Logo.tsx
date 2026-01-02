'use client';

import { motion } from 'framer-motion';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 24, text: 'text-lg' },
    md: { icon: 32, text: 'text-xl' },
    lg: { icon: 48, text: 'text-3xl' }
  };

  const { icon, text } = sizes[size];

  return (
    <div className="flex items-center gap-3">
      <motion.div
        className="relative flex items-center justify-center rounded-xl"
        style={{
          width: icon + 12,
          height: icon + 12,
          background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <svg
          width={icon}
          height={icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Brain/Network icon */}
          <circle cx="12" cy="12" r="3" />
          <circle cx="19" cy="5" r="2" />
          <circle cx="5" cy="5" r="2" />
          <circle cx="19" cy="19" r="2" />
          <circle cx="5" cy="19" r="2" />
          <line x1="12" y1="9" x2="12" y2="3" />
          <line x1="14.5" y1="10.5" x2="17.5" y2="6.5" />
          <line x1="9.5" y1="10.5" x2="6.5" y2="6.5" />
          <line x1="14.5" y1="13.5" x2="17.5" y2="17.5" />
          <line x1="9.5" y1="13.5" x2="6.5" y2="17.5" />
        </svg>
      </motion.div>
      {showText && (
        <div className="flex flex-col">
          <span className={`${text} font-bold text-gradient`}>
            Multi-Index RAG
          </span>
          <span className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Vietnamese Financial & Legal AI
          </span>
        </div>
      )}
    </div>
  );
}
