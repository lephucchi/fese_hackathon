'use client';

import { motion } from 'framer-motion';

const steps = [
  {
    number: '01',
    label: 'User Query',
    description: 'Natural language question in Vietnamese',
    icon: '💬',
  },
  {
    number: '02',
    label: 'Domain Classifier',
    description: 'AI analyzes intent and topic',
    icon: '🎯',
  },
  {
    number: '03',
    label: 'Knowledge Router',
    description: 'Routes to appropriate indices',
    icon: '🔀',
  },
  {
    number: '04',
    label: 'Trusted Indices',
    description: 'Searches across 4 specialized databases',
    icon: '📚',
  },
  {
    number: '05',
    label: 'LLM Synthesis',
    description: 'Generates grounded response',
    icon: '🧠',
  },
  {
    number: '06',
    label: 'Cited Answer',
    description: 'Response with source references',
    icon: '✅',
  },
];

const indices = [
  { label: 'Thuật ngữ', icon: '📖', color: '#6366f1' },
  { label: 'Pháp lý', icon: '⚖️', color: '#8b5cf6' },
  { label: 'Tài chính', icon: '💰', color: '#10b981' },
  { label: 'Tin tức', icon: '📰', color: '#f59e0b' },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" style={{ position: 'relative', padding: '5rem 1rem', background: 'var(--background)', width: '100%' }}>
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
            How It Works
          </h2>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', maxWidth: '42rem', margin: '0 auto', color: 'var(--text-secondary)' }}>
            From question to evidence-based answer in seconds
          </p>
        </motion.div>

        {/* Flow Diagram */}
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'flex-start' }}
              >
                {/* Step indicator */}
                <div style={{ position: 'relative', zIndex: 10, flexShrink: 0, width: 'clamp(3.5rem, 5vw, 4rem)', height: 'clamp(3.5rem, 5vw, 4rem)', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', background: 'var(--surface)', border: '2px solid var(--border)' }}>
                  {step.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, padding: '1.5rem', borderRadius: '1rem', background: 'var(--surface)', border: '1px solid var(--border)', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', background: 'var(--primary)', color: 'white', opacity: 0.9 }}>
                      {step.number}
                    </span>
                    <h3 style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {step.label}
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {step.description}
                  </p>

                  {/* Index badges for step 04 */}
                  {step.number === '04' && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '1rem' }}>
                      {indices.map((idx) => (
                        <span
                          key={idx.label}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.875rem', fontWeight: 500, background: `${idx.color}15`, color: idx.color }}
                        >
                          {idx.icon} {idx.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
