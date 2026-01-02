'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function CTA() {
  return (
    <section style={{ padding: '5rem 1rem', position: 'relative', overflow: 'hidden', width: '100%' }}>
      {/* Background gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', opacity: 0.9 }} />

      {/* Pattern overlay */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.1, backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '56rem', margin: '0 auto', textAlign: 'center' }}>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ fontSize: 'clamp(1.875rem, 4vw, 2.25rem)', fontWeight: 700, marginBottom: '1.5rem', color: 'white' }}
        >
          Start exploring structured knowledge with transparency
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ fontSize: 'clamp(1rem, 2vw, 1.125rem)', marginBottom: '2.5rem', color: 'rgba(255, 255, 255, 0.8)' }}
        >
          Query Vietnamese financial and legal data with evidence-based answers
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Link href="/chat">
            <motion.button
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.75rem', padding: '1.25rem 2.5rem', borderRadius: '1rem', fontSize: '1.125rem', fontWeight: 600, background: 'white', color: 'var(--primary)', boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)', border: 'none', cursor: 'pointer' }}
              whileHover={{ scale: 1.02, boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)' }}
              whileTap={{ scale: 0.98 }}
            >
              Open Chatbot
              <ArrowRight size={20} />
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
