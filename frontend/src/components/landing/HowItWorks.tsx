'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '01',
    title: 'Lọc tin nhanh',
    description: 'Mở app vào buổi sáng. Vuốt qua 10 tin quan trọng nhất. Chỉ mất 2 phút.',
    icon: Zap
  },
  {
    number: '02',
    title: 'Xem tác động',
    description: 'AI phân tích ngay tác động của tin tức đến danh mục của bạn với nhãn màu rõ ràng.',
    icon: Target
  },
  {
    number: '03',
    title: 'Ra quyết định',
    description: 'Chat với AI để hiểu sâu. Nhận báo cáo tổng hợp và khuyến nghị hành động.',
    icon: TrendingUp
  }
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        padding: '80px 0',
        background: 'var(--background)'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            Cách hoạt động
          </h2>
          <p style={{
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Ba bước đơn giản để nắm bắt thị trường mỗi ngày
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '48px',
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
                  {step.number}
                </div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '12px'
                }}>
                  {step.title}
                </h3>
                <p style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
