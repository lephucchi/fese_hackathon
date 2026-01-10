'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, BarChart3, Sparkles, Award, BookOpen } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const featureKeys = [
  { icon: Zap, key: 'swipe', color: '#00C805' },
  { icon: Target, key: 'analysis', color: '#FFD700' },
  { icon: BarChart3, key: 'report', color: '#FF9F1C' },
  { icon: Sparkles, key: 'chat', color: '#00C805' },
  { icon: Award, key: 'mpoint', color: '#FFD700' },
  { icon: BookOpen, key: 'academy', color: '#FF9F1C' }
];

export function FeatureHighlights() {
  const { t } = useLanguage();

  return (
    <section
      id="features"
      style={{
        padding: 'clamp(40px, 8vw, 80px) 0',
        background: 'var(--background-soft)',
        width: '100%'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 1.5rem)' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(0, 200, 5, 0.1)',
            borderRadius: '9999px',
            marginBottom: '16px'
          }}>
            <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 600 }}>
              {t('features.badge')}
            </span>
          </div>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            {t('features.title')}
          </h2>
          <p style={{ 
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {t('features.subtitle')}
          </p>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(20px, 4vw, 32px)'
        }}>
          {featureKeys.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card interactive-lift"
              style={{ 
                padding: 'clamp(20px, 4vw, 32px)'
              }}
            >
              <div style={{ 
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `${feature.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: feature.color
              }}>
                <feature.icon size={28} />
              </div>

              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: 'var(--text-primary)'
                }}
              >
                {t(`features.${feature.key}.title`)}
              </h3>

              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)'
                }}
              >
                {t(`features.${feature.key}.description`)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
