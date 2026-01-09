'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, BarChart3, Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  labelKey: string;
  href: string;
}

const navItems: NavItem[] = [
  { labelKey: 'nav.home', href: '/' },
  { labelKey: 'nav.news', href: '/dashboard' },
  { labelKey: 'nav.personal', href: '/personal' },
  { labelKey: 'nav.education', href: '/education' },
  { labelKey: 'nav.about', href: '/about' },
];

interface NavigationProps {
  onLoginClick?: () => void;
}

export function Navigation({ onLoginClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();

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
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            {/* AI Neural Network Logo */}
            <svg
              width="40" 
              height="40" 
              viewBox="0 0 40 40" 
              style={{ position: 'relative' }}
            >
              {/* Outer neural network nodes */}
              <circle cx="20" cy="8" r="3" fill="#000" opacity="0.9" />
              <circle cx="32" cy="20" r="3" fill="#000" opacity="0.9" />
              <circle cx="20" cy="32" r="3" fill="#000" opacity="0.9" />
              <circle cx="8" cy="20" r="3" fill="#000" opacity="0.9" />
              
              {/* Connecting lines */}
              <line x1="20" y1="8" x2="20" y2="15" stroke="#00C805" strokeWidth="2" opacity="0.6" />
              <line x1="32" y1="20" x2="25" y2="20" stroke="#00C805" strokeWidth="2" opacity="0.6" />
              <line x1="20" y1="32" x2="20" y2="25" stroke="#00C805" strokeWidth="2" opacity="0.6" />
              <line x1="8" y1="20" x2="15" y2="20" stroke="#00C805" strokeWidth="2" opacity="0.6" />
              
              {/* Diagonal connections */}
              <line x1="20" y1="8" x2="28" y2="16" stroke="#00C805" strokeWidth="1.5" opacity="0.4" />
              <line x1="32" y1="20" x2="24" y2="28" stroke="#00C805" strokeWidth="1.5" opacity="0.4" />
              <line x1="20" y1="32" x2="12" y2="24" stroke="#00C805" strokeWidth="1.5" opacity="0.4" />
              <line x1="8" y1="20" x2="16" y2="12" stroke="#00C805" strokeWidth="1.5" opacity="0.4" />
              
              {/* Central AI core with gradient */}
              <defs>
                <linearGradient id="coreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00C805" />
                  <stop offset="100%" stopColor="#00a004" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              {/* Central pulsing core */}
              <circle cx="20" cy="20" r="7" fill="url(#coreGradient)" filter="url(#glow)" />
              
              {/* Inner black circuit pattern */}
              <path d="M 20 16 L 20 13" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <path d="M 24 20 L 27 20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <path d="M 20 24 L 20 27" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              <path d="M 16 20 L 13 20" stroke="#000" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
              
              {/* Data flow particles */}
              <circle cx="18" cy="18" r="1.5" fill="#000" opacity="0.7">
                <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx="22" cy="22" r="1.5" fill="#000" opacity="0.7">
                <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
              </circle>
            </svg>
            <span
              style={{
                fontWeight: 700,
                fontSize: '1.25rem',
                background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.02em'
              }}
              className="hidden-sm"
            >
              MacroInsight
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ alignItems: 'center', gap: '0.5rem' }} className="show-md-flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    position: 'relative',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  {/* Bubble Background for Active Tab */}
                  {isActive && (
                    <motion.div
                      layoutId="navBubble"
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0, 200, 5, 0.15)',
                        border: '1px solid rgba(0, 200, 5, 0.3)',
                        borderRadius: '9999px',
                        boxShadow: '0 0 20px rgba(0, 200, 5, 0.2)',
                        zIndex: -1
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                  {t(item.labelKey)}
                </Link>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                borderRadius: '0.5rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: 'var(--text-secondary)'
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
              aria-label="Toggle language"
            >
              <Globe size={16} />
              <span className="hidden-sm">{language === 'vi' ? 'EN' : 'VN'}</span>
            </button>

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

            {/* Login Button - Desktop */}
            {onLoginClick && (
              <button
                onClick={onLoginClick}
                className="interactive-scale hidden-sm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.5rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'var(--primary)',
                  boxShadow: '0 4px 12px rgba(0, 200, 5, 0.2)',
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 200, 5, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 200, 5, 0.2)';
                }}
              >
                Đăng nhập
              </button>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="hide-md"
              style={{
                display: 'flex',
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
            className="hide-md"
            style={{
              overflow: 'hidden',
              background: 'var(--background)',
              borderBottom: '1px solid var(--border)'
            }}
          >
            <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'block',
                      padding: '0.75rem 1rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'white' : 'var(--text-primary)',
                      background: isActive ? 'var(--primary)' : 'var(--surface)',
                      textDecoration: 'none',
                      border: isActive ? '1px solid var(--primary)' : '1px solid transparent',
                      boxShadow: isActive ? '0 0 12px rgba(0, 200, 5, 0.3)' : 'none',
                      transition: 'all 0.2s'
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(item.labelKey)}
                  </Link>
                );
              })}
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
