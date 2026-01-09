'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, TrendingUp, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';

interface NavItem {
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Market', href: '/dashboard' },
  { label: 'Personal', href: '/personal' },
  { label: 'Education', href: '/education' },
];

interface NavigationProps {
  onLoginClick?: () => void;
}

export function Navigation({ onLoginClick }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useTheme();
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
            {/* Modern Logo with Gradient Icon */}
            <div
              style={{
                width: '2.5rem',
                height: '2.5rem',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--primary) 0%, #00a004 100%)',
                boxShadow: '0 4px 12px rgba(0, 200, 5, 0.25)',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Animated background glow */}
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.3), transparent)',
                opacity: 0.5
              }} />
              <TrendingUp
                size={20}
                style={{
                  color: 'white',
                  position: 'relative',
                  strokeWidth: 2.5
                }}
              />
            </div>
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
                  {item.label}
                </Link>
              );
            })}
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

            {/* Login Button - Desktop */}
            {onLoginClick && (
              <button
                onClick={onLoginClick}
                className="interactive-scale hidden-sm"
                style={{
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
                    {item.label}
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
