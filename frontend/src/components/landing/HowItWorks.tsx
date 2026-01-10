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
<<<<<<< HEAD
    <section
      id="how-it-works"
      style={{
        padding: '80px 0',
=======
    <section 
      id="how-it-works" 
      style={{ 
        padding: 'clamp(40px, 8vw, 80px) 0',
>>>>>>> main
        background: 'var(--background)'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 1.5rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            {t('howItWorks.title')}
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {t('howItWorks.subtitle')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'clamp(24px, 5vw, 48px)',
          position: 'relative'
        }}>
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              style={{ position: 'relative' }}
            >
              {/* Connector Line */}
              {i < steps.length - 1 && (
                <div className="hide-mobile" style={{
                  position: 'absolute',
                  top: '40px',
                  left: '100%',
                  width: '100%',
                  height: '2px',
                  background: 'linear-gradient(90deg, var(--primary) 0%, transparent 100%)',
                  opacity: 0.3
                }} />
              )}

              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  color: 'white',
                  boxShadow: 'var(--shadow-glow)'
                }}>
                  <step.icon size={24} />
                </div>
                <div style={{
                  fontSize: '3rem',
                  fontWeight: 800,
                  color: 'var(--primary)',
                  opacity: 1,
                  marginBottom: '8px',
                  textShadow: '0 0 20px rgba(0, 200, 5, 0.3)'
                }}>
                  {t(`howItWorks.${step.key}.number`)}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  {t(`howItWorks.${step.key}.title`)}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
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
