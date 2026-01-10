'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const stepIcons = [Zap, Target, TrendingUp];

export function HowItWorks() {
  const { t } = useLanguage();

  const steps = [
    { key: 'step1', icon: stepIcons[0] },
    { key: 'step2', icon: stepIcons[1] },
    { key: 'step3', icon: stepIcons[2] }
  ];

  return (
    <section
      id="how-it-works"
      style={{
        padding: 'clamp(60px, 10vw, 100px) 0',
        background: 'linear-gradient(180deg, var(--background) 0%, var(--background-soft) 50%, var(--background) 100%)'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 1.5rem)' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', marginBottom: '80px' }}
        >
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(0, 200, 5, 0.1)',
            borderRadius: '9999px',
            fontSize: '14px',
            fontWeight: 600,
            color: 'var(--primary)',
            marginBottom: '20px',
            border: '1px solid rgba(0, 200, 5, 0.2)'
          }}>
            {t('howItWorks.badge')}
          </span>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: 800,
            marginBottom: '20px',
            background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--primary) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            {t('howItWorks.title')}
          </h2>
          <p style={{
            fontSize: '1.25rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            lineHeight: 1.7
          }}>
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        {/* Progress Line - Desktop Only */}
        <div className="hide-mobile" style={{
          position: 'relative',
          maxWidth: '800px',
          margin: '0 auto 60px',
          height: '4px',
          background: 'var(--border)',
          borderRadius: '2px'
        }}>
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: '100%' }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              background: 'linear-gradient(90deg, var(--primary) 0%, #00E676 50%, var(--primary) 100%)',
              borderRadius: '2px',
              boxShadow: '0 0 20px rgba(0, 200, 5, 0.5)'
            }}
          />
          {/* Progress Dots */}
          {steps.map((_, i) => (
            <motion.div
              key={i}
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 + i * 0.2 }}
              style={{
                position: 'absolute',
                top: '50%',
                left: `${i * 50}%`,
                transform: 'translate(-50%, -50%)',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                background: 'var(--primary)',
                border: '3px solid var(--background)',
                boxShadow: '0 0 15px rgba(0, 200, 5, 0.6)'
              }}
            />
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(24px, 5vw, 40px)',
          position: 'relative'
        }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              style={{ position: 'relative' }}
            >
              <div
                className="card interactive-scale"
                style={{
                  textAlign: 'center',
                  padding: 'clamp(32px, 5vw, 48px) clamp(24px, 4vw, 32px)',
                  background: 'linear-gradient(135deg, var(--surface) 0%, var(--background) 100%)',
                  border: '1px solid var(--border)',
                  borderRadius: '24px',
                  position: 'relative',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
              >
                {/* Decorative gradient */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, var(--primary), #00E676)',
                  opacity: 0.8
                }} />

                {/* Step Number Badge */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  fontSize: '4rem',
                  fontWeight: 900,
                  color: 'var(--primary)',
                  opacity: 0.1,
                  lineHeight: 1
                }}>
                  {t(`howItWorks.${step.key}.number`)}
                </div>

                {/* Icon */}
                <motion.div
                  whileHover={{ rotate: 10, scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #00E676 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 28px',
                    color: 'white',
                    boxShadow: '0 10px 40px rgba(0, 200, 5, 0.4), 0 0 0 8px rgba(0, 200, 5, 0.1)',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <step.icon size={36} strokeWidth={2} />
                </motion.div>

                {/* Step Number */}
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: 'var(--primary)',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
                >
                  {t('howItWorks.stepPrefix')} {t(`howItWorks.${step.key}.number`)}
                </div>

                {/* Title */}
                <h3 style={{
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.5rem)',
                  fontWeight: 700,
                  marginBottom: '16px',
                  color: 'var(--text-primary)'
                }}>
                  {t(`howItWorks.${step.key}.title`)}
                </h3>

                {/* Description */}
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.7,
                  fontSize: '0.95rem'
                }}>
                  {t(`howItWorks.${step.key}.description`)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
