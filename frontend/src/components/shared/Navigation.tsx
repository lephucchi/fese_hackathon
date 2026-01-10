'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Moon, Sun, LogOut, User as UserIcon, Globe } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';

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
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await logout();
    setShowUserMenu(false);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        transition: 'all 0.3s',
        background: '#181D2A',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <nav style={{ width: '100%', maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(0.75rem, 2vw, 1rem)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem', gap: '0.5rem' }}>
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              textDecoration: 'none',
              transition: 'all 0.2s',
              flexShrink: 0
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
            {/* MacroInsight Logo */}
            <img
              src="/logo_new-removebg-preview-nobg.svg"
              alt="MacroInsight Logo"
              width={44}
              height={44}
              style={{ position: 'relative', flexShrink: 0 }}
            />
            <span
              style={{
                fontWeight: 700,
                fontSize: 'clamp(0.875rem, 3.5vw, 1.25rem)',
                color: '#FFFFFF',
                letterSpacing: '-0.02em',
                fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap'
              }}
            >
              MacroInsight
            </span>
          </Link>

          {/* Desktop Nav */}
          <div style={{ alignItems: 'center', gap: '0.5rem', flexShrink: 1, minWidth: 0 }} className="show-md-flex">
            {navItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    fontSize: '0.875rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary)' : '#FFFFFF',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                    position: 'relative',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#FFFFFF';
                    }
                  }}
                >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.375rem, 1.5vw, 0.75rem)', flexShrink: 0 }}>
            {/* Language Toggle */}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.375rem',
                padding: '0.5rem 0.625rem',
                borderRadius: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontSize: '0.75rem',
                fontWeight: 600,
                color: '#FFFFFF',
                minWidth: '2.5rem',
                justifyContent: 'center',
                whiteSpace: 'nowrap',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)';
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                e.currentTarget.style.color = '#FFFFFF';
              }}
              aria-label="Toggle language"
            >
              <Globe size={14} />
              <span>{language === 'vi' ? 'EN' : 'VN'}</span>
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
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <Moon size={16} style={{ color: '#FFFFFF' }} />
              ) : (
                <Sun size={16} style={{ color: '#FFFFFF' }} />
              )}
            </button>

            {/* User Menu or Login Button - Desktop */}
            {isAuthenticated && user ? (
              <div style={{ position: 'relative' }} className="hide-mobile">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="interactive-scale"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '9999px',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: '#FFFFFF',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  }}
                >
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #4ADE80 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '0.75rem',
                    fontWeight: 700
                  }}>
                    {user.display_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.display_name || user.email.split('@')[0]}</span>
                </button>

                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 0.5rem)',
                        right: 0,
                        minWidth: '200px',
                        background: 'var(--card)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                        padding: '0.5rem',
                        zIndex: 100
                      }}
                    >
                      <Link
                        href="/personal"
                        onClick={() => setShowUserMenu(false)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          color: 'var(--text-primary)',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <UserIcon size={18} />
                        <span style={{ fontSize: '0.875rem' }}>Trang ca nhan</span>
                      </Link>
                      <div style={{ height: '1px', background: 'var(--border)', margin: '0.5rem 0' }} />
                      <button
                        onClick={handleLogout}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem',
                          borderRadius: '8px',
                          background: 'transparent',
                          border: 'none',
                          color: '#EF4444',
                          cursor: 'pointer',
                          fontSize: '0.875rem',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <LogOut size={18} />
                        <span>{t('auth.logout')}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : onLoginClick ? (
              <button
                onClick={onLoginClick}
                className="interactive-scale hide-mobile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.625rem 1.25rem',
                  borderRadius: '9999px',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'var(--primary)',
                  boxShadow: '0 4px 12px rgba(0, 200, 5, 0.2)',
                  textDecoration: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
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
                Dang nhap
              </button>
            ) : null}

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
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                transition: 'transform 0.2s',
                flexShrink: 0
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={18} style={{ color: '#FFFFFF' }} />
              ) : (
                <Menu size={18} style={{ color: '#FFFFFF' }} />
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
              background: '#181D2A',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
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
