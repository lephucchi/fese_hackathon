'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Play } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface HeroProps {
  onGetStarted: () => void;
}

export function Hero({ onGetStarted }: HeroProps) {
  const { t } = useLanguage();

  return (
    <section
      id="hero"
      style={{
        paddingTop: '140px',
        paddingBottom: '80px',
        background: 'var(--background)',
        position: 'relative',
        overflow: 'hidden',
        width: '100%'
      }}
    >
      {/* Background Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-5%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(0, 200, 5, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none'
      }} />

      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '900px', margin: '0 auto', padding: '0 0.5rem' }}>
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 20px',
              background: 'rgba(0, 200, 5, 0.1)',
              borderRadius: '9999px',
              marginBottom: '24px',
              border: '1px solid rgba(0, 200, 5, 0.2)'
            }}
          >
            <Sparkles size={16} color="var(--primary)" />
            <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 600 }}>
              {t('hero.badge')}
            </span>
          </motion.div>

          {/* Main Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 4rem)',
              fontWeight: 800,
              lineHeight: 1.15,
              marginBottom: '20px',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              padding: '0 0.5rem'
            }}
          >
            {t('hero.title')} <br />
            <span className="text-gradient">{t('hero.titleHighlight')}</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              fontSize: 'clamp(1rem, 2vw, 1.25rem)',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '32px',
              maxWidth: '700px',
              margin: '0 auto 32px',
              padding: '0 0.5rem'
            }}
          >
            {t('hero.subtitle')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '48px',
              flexDirection: 'column',
              alignItems: 'stretch',
              padding: '0 1rem'
            }}
            className="hero-cta-buttons"
          >
            <button
              onClick={onGetStarted}
              className="btn-primary interactive-scale"
              style={{
                padding: '16px 40px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '9999px'
              }}
            >
              {t('hero.ctaPrimary')}
              <ArrowRight size={20} />
            </button>
            <button
              className="btn-secondary interactive-scale"
              style={{
                padding: '16px 40px',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '9999px'
              }}
            >
              <Play size={18} />
              {t('hero.ctaSecondary')}
            </button>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '32px',
              maxWidth: '700px',
              margin: '0 auto'
            }}
          >
            {[
              { value: '2 min', labelKey: 'hero.stats.saved' },
              { value: '10+', labelKey: 'hero.stats.accuracy' },
              { value: '24/7', labelKey: 'hero.stats.users' }
            ].map((stat, i) => (
              <div key={i}>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  marginBottom: '4px'
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--text-tertiary)'
                }}>
                  {t(stat.labelKey)}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
