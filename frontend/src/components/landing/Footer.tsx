'use client';

import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '64px 0 32px',
      background: 'var(--glass-bg)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
          marginBottom: '48px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={28} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                MacroInsight
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              {t('footer.tagline')}
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: 'var(--text-primary)',
              fontSize: '16px'
            }}>
              {t('footer.product')}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#features" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {t('footer.features')}
                </a>
              </li>
              <li>
                <a href="#pricing" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {t('footer.pricing')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: 'var(--text-primary)',
              fontSize: '16px'
            }}>
              {t('footer.company')}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <Link href="/about" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {t('footer.about')}
                </Link>
              </li>
              <li>
                <a href="#contact" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  {t('footer.contact')}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div style={{
          paddingTop: '32px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          © {new Date().getFullYear()} {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
}
