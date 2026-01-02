'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from '@/hooks/useTheme';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Chat', href: '/chat' },
];

export function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.3s',
        background: 'var(--glass-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <nav style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
          {/* Logo */}
          <Link 
            href="/" 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              textDecoration: 'none',
              transition: 'opacity 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
          >
            <div
              style={{ 
                width: '2.25rem', 
                height: '2.25rem', 
                borderRadius: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' 
              }}
            >
              <span style={{ color: 'white', fontWeight: 'bold', fontSize: '0.875rem' }}>MR</span>
            </div>
            <span 
              style={{ 
                fontWeight: 600, 
                fontSize: '1.125rem', 
                color: 'var(--text-primary)',
                display: window.innerWidth >= 640 ? 'block' : 'none'
              }}
            >
              Multi-RAG
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ display: window.innerWidth >= 768 ? 'flex' : 'none', alignItems: 'center', gap: '2rem' }}>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'opacity 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{ 
                width: '2.5rem', 
                height: '2.5rem', 
                borderRadius: '0.5rem', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'var(--surface)', 
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon size={18} style={{ color: 'var(--text-secondary)' }} />
              ) : (
                <Sun size={18} style={{ color: 'var(--text-secondary)' }} />
              )}
            </button>

            {/* CTA Button - Desktop */}
            <Link
              href="/chat"
              style={{ 
                display: window.innerWidth >= 640 ? 'flex' : 'none',
                alignItems: 'center', 
                gap: '0.5rem', 
                padding: '0.625rem 1.25rem', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem', 
                fontWeight: 500, 
                color: 'white',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', 
                boxShadow: 'var(--shadow-md)',
                textDecoration: 'none',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              Open Chat
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              style={{ 
                display: window.innerWidth >= 768 ? 'none' : 'flex',
                width: '2.5rem', 
                height: '2.5rem', 
                borderRadius: '0.5rem', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: 'var(--surface)', 
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={20} style={{ color: 'var(--text-primary)' }} />
              ) : (
                <Menu size={20} style={{ color: 'var(--text-primary)' }} />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ 
              display: window.innerWidth >= 768 ? 'none' : 'block',
              overflow: 'hidden',
              background: 'var(--background)',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{ 
                    display: 'block',
                    padding: '0.75rem 1rem', 
                    borderRadius: '0.5rem', 
                    fontSize: '0.875rem', 
                    fontWeight: 500,
                    color: 'var(--text-primary)', 
                    background: 'var(--surface)',
                    textDecoration: 'none'
                  }}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href="/chat"
                style={{ 
                  display: 'block',
                  padding: '0.75rem 1rem', 
                  borderRadius: '0.5rem', 
                  fontSize: '0.875rem', 
                  fontWeight: 500, 
                  textAlign: 'center', 
                  color: 'white',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  textDecoration: 'none'
                }}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Open Chat
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
