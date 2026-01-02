'use client';

import { motion } from 'framer-motion';

const useCases = [
  {
    icon: '📊',
    title: 'Finance & Economics',
    description: 'Company financials, market analysis, earnings reports',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: '⚖️',
    title: 'Policy & Regulation',
    description: 'Vietnamese business law, legal compliance, regulations',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    icon: '📰',
    title: 'Research & Market News',
    description: 'Market trends, industry updates, VN-Index movements',
    gradient: 'from-orange-500 to-yellow-500',
  },
  {
    icon: '📖',
    title: 'Financial Terminology',
    description: 'Technical definitions, metrics like P/E, ROE, EPS',
    gradient: 'from-green-500 to-emerald-500',
  },
];

export function UseCases() {
  return (
    <section style={{ padding: '5rem 1rem', background: 'var(--surface)', width: '100%' }}>
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto' }}>
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h2 style={{ fontSize: 'clamp(1.875rem, 4vw, 3rem)', fontWeight: 700, marginBottom: '1rem', color: 'var(--text-primary)' }}>
            Knowledge Domains
          </h2>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', maxWidth: '42rem', margin: '0 auto', color: 'var(--text-secondary)' }}>
            Specialized indices for Vietnamese financial and legal research
          </p>
        </motion.div>

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{ position: 'relative', overflow: 'hidden', padding: '2rem', borderRadius: '1rem', background: 'var(--background)', border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.2s' }}
              whileHover={{ scale: 1.02, boxShadow: 'var(--shadow-md)' }}
            >
              <div style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                <div style={{ flexShrink: 0, width: '3.5rem', height: '3.5rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: 'var(--surface)' }}>
                  {useCase.icon}
                </div>
                <div>
                  <h3 style={{ fontSize: 'clamp(1.125rem, 2vw, 1.25rem)', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    {useCase.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                    {useCase.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
