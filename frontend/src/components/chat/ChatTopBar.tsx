'use client';

import { ArrowLeft, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';

export function ChatTopBar() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header style={{ flexShrink: 0, background: 'var(--background)', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto', padding: '0 1rem', height: '3.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Back to Home */}
        <Link 
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)', textDecoration: 'none', transition: 'opacity 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
        >
          <ArrowLeft size={18} />
          <span className="hidden sm:inline">Back to Home</span>
        </Link>

        {/* Title */}
        <h1 style={{ fontSize: '1.125rem', fontWeight: 600, background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Multi-Index RAG
        </h1>

        {/* Theme Toggle */}
        <motion.button
          onClick={toggleTheme}
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2.25rem', height: '2.25rem', borderRadius: '0.5rem', background: 'var(--surface)', border: '1px solid var(--border)', cursor: 'pointer' }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? (
            <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
          ) : (
            <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
          )}
        </motion.button>
      </div>
    </header>
  );
}
