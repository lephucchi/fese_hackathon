'use client';

import { motion } from 'framer-motion';
import { Target, BookOpen, CheckCircle, Search } from 'lucide-react';

const values = [
  {
    icon: Target,
    title: 'Multi-Index Routing',
    description: 'Intelligent query classification across 4 specialized knowledge domains',
    color: '#6366f1',
  },
  {
    icon: BookOpen,
    title: 'Source-aware Retrieval',
    description: 'Every answer traces back to original source documents',
    color: '#8b5cf6',
  },
  {
    icon: CheckCircle,
    title: 'Evidence-based Answering',
    description: 'Citations embedded inline — no black box responses',
    color: '#10b981',
  },
  {
    icon: Search,
    title: 'Research-grade Transparency',
    description: 'See routing decisions, retrieval scores, and processing time',
    color: '#f59e0b',
  },
];

export function CoreValue() {
  return (
    <section style={{ position: 'relative', padding: '5rem 1rem', background: 'var(--surface)', width: '100%' }}>
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
            What makes it different?
          </h2>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', maxWidth: '42rem', margin: '0 auto', color: 'var(--text-secondary)' }}>
            A serious system for serious research needs
          </p>
        </motion.div>

        {/* Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: 'clamp(1rem, 3vw, 2rem)' }}>
          {values.map((value, index) => (
            <motion.div
              key={value.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{
                padding: '2rem',
                borderRadius: '1rem',
                background: 'var(--background)',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              whileHover={{ scale: 1.05, boxShadow: 'var(--shadow-md)' }}
            >
              <motion.div
                style={{ width: '3rem', height: '3rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem', background: `${value.color}15` }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <value.icon size={24} style={{ color: value.color }} />
              </motion.div>
              <h3 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--text-primary)' }}>
                {value.title}
              </h3>
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                {value.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
