'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface PricingProps {
  onGetStarted: () => void;
}

export function Pricing({ onGetStarted }: PricingProps) {
  const { t } = useLanguage();

  const plans = [
    {
      nameKey: 'pricing.free.name',
      priceKey: 'pricing.free.price',
      periodKey: 'pricing.free.period',
      featuresKey: 'pricing.free.features',
      ctaKey: 'pricing.free.cta',
      highlight: false
    },
    {
      nameKey: 'pricing.pro.name',
      priceKey: 'pricing.pro.price',
      periodKey: 'pricing.pro.period',
      featuresKey: 'pricing.pro.features',
      ctaKey: 'pricing.pro.cta',
      highlight: true
    }
  ];

  // Helper to get features array
  const getFeatures = (key: string): string[] => {
    const result = t(key);
    if (Array.isArray(result)) return result;
    // If t() returns a string (fallback), return empty array
    return [];
  };

  return (
    <section 
      id="pricing" 
      style={{ 
        padding: 'clamp(40px, 8vw, 80px) 0',
        background: 'var(--background-soft)'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 1.5rem)' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            {t('pricing.title')}
          </h2>
          <p style={{ 
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            {t('pricing.subtitle')}
          </p>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'clamp(20px, 4vw, 32px)',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {plans.map((plan, i) => {
            const features = getFeatures(plan.featuresKey);
            
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="card"
                style={{ 
                  padding: 'clamp(24px, 5vw, 40px)',
                  border: plan.highlight ? '2px solid var(--primary)' : '1px solid var(--border)',
                  position: 'relative'
                }}
              >
                {plan.highlight && (
                  <div style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--primary)',
                    color: 'white',
                    padding: '6px 20px',
                    borderRadius: '9999px',
                    fontSize: '13px',
                    fontWeight: 600
                  }}>
                    {t('pricing.popular')}
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ 
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    marginBottom: '8px'
                  }}>
                    {t(plan.nameKey)}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                    <span style={{ 
                      fontSize: '3rem',
                      fontWeight: 800,
                      color: 'var(--primary)'
                    }}>
                      {t(plan.priceKey)}
                    </span>
                    <span style={{ 
                      color: 'var(--text-tertiary)',
                      fontSize: '1rem'
                    }}>
                      {t(plan.periodKey)}
                    </span>
                  </div>
                </div>

                <ul style={{ 
                  listStyle: 'none',
                  marginBottom: '32px'
                }}>
                  {features.map((feature, j) => (
                    <li key={j} style={{ 
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      marginBottom: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      <Check size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={onGetStarted}
                  className={plan.highlight ? 'btn-primary interactive-scale' : 'btn-secondary interactive-scale'}
                  style={{ 
                    width: '100%',
                    padding: '14px',
                    fontSize: '15px'
                  }}
                >
                  {t(plan.ctaKey)}
                </button>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
