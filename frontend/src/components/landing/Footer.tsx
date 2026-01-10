'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      padding: 'clamp(2rem, 6vw, 4rem) 0 clamp(1rem, 3vw, 2rem)',
      background: '#181D2A'
    }}>
      <div style={{ 
        maxWidth: '1280px', 
        margin: '0 auto', 
        padding: '0 clamp(1rem, 4vw, 2rem)' 
      }}>
        {/* Footer Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 'clamp(2rem, 5vw, 3rem)',
          marginBottom: 'clamp(2rem, 5vw, 3rem)',
          alignItems: 'start'
        }}>
          {/* Brand Section */}
          <div style={{ 
            gridColumn: 'span 1',
            minWidth: 0
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              marginBottom: '1rem',
              flexWrap: 'nowrap'
            }}>
              <img
                src="/logo_new-removebg-preview-nobg.svg"
                alt="MacroInsight Logo"
                width={32}
                height={32}
                style={{ flexShrink: 0 }}
              />
              <span style={{ 
                fontSize: 'clamp(1.125rem, 3vw, 1.375rem)', 
                fontWeight: '700', 
                color: '#FFFFFF', 
                fontFamily: 'var(--font-inter), system-ui, -apple-system, sans-serif',
                whiteSpace: 'nowrap'
              }}>
                MacroInsight
              </span>
            </div>
            <p style={{ 
              color: 'rgba(255, 255, 255, 0.7)', 
              fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)', 
              lineHeight: '1.6',
              margin: 0
            }}>
              {t('footer.tagline')}
            </p>
          </div>

          {/* Product Section */}
          <div style={{ minWidth: 0 }}>
            <h3 style={{ 
              fontWeight: '600', 
              marginBottom: '1.25rem', 
              color: '#FFFFFF',
              fontSize: 'clamp(0.9375rem, 2vw, 1rem)',
              margin: '0 0 1.25rem 0'
            }}>
              {t('footer.product')}
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem' 
            }}>
              <li>
                <a href="#features" style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  textDecoration: 'none', 
                  fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
                  transition: 'color 0.2s',
                  display: 'inline-block'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}>
                  {t('footer.features')}
                </a>
              </li>
              <li>
                <a href="#pricing" style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  textDecoration: 'none', 
                  fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
                  transition: 'color 0.2s',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}>
                  {t('footer.pricing')}
                </a>
              </li>
            </ul>
          </div>

          {/* Company Section */}
          <div style={{ minWidth: 0 }}>
            <h3 style={{ 
              fontWeight: '600', 
              marginBottom: '1.25rem', 
              color: '#FFFFFF',
              fontSize: 'clamp(0.9375rem, 2vw, 1rem)',
              margin: '0 0 1.25rem 0'
            }}>
              {t('footer.company')}
            </h3>
            <ul style={{ 
              listStyle: 'none', 
              padding: 0, 
              margin: 0, 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem' 
            }}>
              <li>
                <Link href="/about" style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  textDecoration: 'none', 
                  fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
                  transition: 'color 0.2s',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}>
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <a href="#contact" style={{ 
                  color: 'rgba(255, 255, 255, 0.7)', 
                  textDecoration: 'none', 
                  fontSize: 'clamp(0.875rem, 2vw, 0.9375rem)',
                  transition: 'color 0.2s',
                  display: 'inline-block'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)'}>
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright Section */}
        <div style={{
          paddingTop: 'clamp(1.5rem, 4vw, 2rem)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: 'clamp(0.8125rem, 2vw, 0.875rem)'
        }}>
          © {new Date().getFullYear()} {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
