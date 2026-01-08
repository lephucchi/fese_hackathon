'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface PricingProps {
  onGetStarted: () => void;
}

const plans = [
  {
    name: 'Miễn phí',
    price: '0đ',
    period: '/tháng',
    features: [
      'Lọc 10 tin mỗi ngày',
      'Phân tích tác động cơ bản',
      'Chat AI (giới hạn)',
      'Nội dung học miễn phí'
    ],
    cta: 'Bắt đầu',
    highlight: false
  },
  {
    name: 'Pro',
    price: '299.000đ',
    period: '/tháng',
    features: [
      'Lọc không giới hạn',
      'Phân tích chuyên sâu',
      'Chat AI không giới hạn',
      'Báo cáo tổng hợp hàng ngày',
      'Toàn bộ video cao cấp',
      'Ưu tiên hỗ trợ'
    ],
    cta: 'Nâng cấp Pro',
    highlight: true
  }
];

export function Pricing({ onGetStarted }: PricingProps) {
  return (
    <section 
      id="pricing" 
      style={{ 
        padding: '80px 0',
        background: 'var(--background-soft)'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            Gói dịch vụ
          </h2>
          <p style={{ 
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Chọn gói phù hợp với nhu cầu đầu tư của bạn
          </p>
        </div>

        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          maxWidth: '900px',
          margin: '0 auto'
        }}>
          {plans.map((plan, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card"
              style={{ 
                padding: '40px',
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
                  PHỔ BIẾN NHẤT
                </div>
              )}

              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ 
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '8px'
                }}>
                  {plan.name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                  <span style={{ 
                    fontSize: '3rem',
                    fontWeight: 800,
                    color: 'var(--primary)'
                  }}>
                    {plan.price}
                  </span>
                  <span style={{ 
                    color: 'var(--text-tertiary)',
                    fontSize: '1rem'
                  }}>
                    {plan.period}
                  </span>
                </div>
              </div>

              <ul style={{ 
                listStyle: 'none',
                marginBottom: '32px'
              }}>
                {plan.features.map((feature, j) => (
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
                {plan.cta}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
