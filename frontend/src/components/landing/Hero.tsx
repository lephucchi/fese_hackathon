'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section 
      id="hero"
      style={{ 
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '5rem',
        paddingBottom: '4rem',
        paddingLeft: '1rem',
        paddingRight: '1rem',
        background: 'var(--background)',
        width: '100%',
        overflow: 'hidden'
      }}
    >
      {/* Background gradient */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.2,
          background: 'radial-gradient(ellipse at 50% 30%, var(--primary) 0%, transparent 60%)',
          pointerEvents: 'none'
        }}
      />

      <div style={{ 
        position: 'relative', 
        zIndex: 10, 
        width: '100%', 
        maxWidth: '72rem', 
        margin: '0 auto', 
        textAlign: 'center'
      }}>
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            padding: '0.5rem 1rem', 
            borderRadius: '9999px', 
            marginBottom: '1.5rem',
            background: 'var(--surface)', 
            border: '1px solid var(--border)' 
          }}
        >
          <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Powered by LangGraph & Supabase
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{ 
            fontSize: 'clamp(2rem, 5vw, 4rem)',
            fontWeight: 700,
            marginBottom: '1.5rem',
            lineHeight: 1.2,
            padding: '0 1rem',
            color: 'var(--text-primary)'
          }}
        >
          Multi-Domain{' '}
          <span className="text-gradient">Knowledge Router</span>
          <br />
          <span style={{ fontSize: 'clamp(1.5rem, 4vw, 3rem)' }}>powered by RAG</span>
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)',
            marginBottom: '2.5rem',
            maxWidth: '42rem',
            margin: '0 auto 2.5rem',
            padding: '0 1rem',
            color: 'var(--text-secondary)'
          }}
        >
          Query once. Route intelligently. Answer with evidence.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            padding: '0 1rem'
          }}
        >
          <Link href="/chat" style={{ width: '100%', maxWidth: '300px' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                borderRadius: '0.75rem',
                color: 'white',
                fontWeight: 600,
                fontSize: '1.125rem',
                width: '100%',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                boxShadow: 'var(--shadow-glow)',
                transition: 'all 0.2s'
              }}
            >
              Try the Chatbot
              <ArrowRight size={20} />
            </button>
          </Link>
          <Link href="#how-it-works" style={{ width: '100%', maxWidth: '300px' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.875rem 2rem',
                borderRadius: '0.75rem',
                fontWeight: 600,
                fontSize: '1.125rem',
                width: '100%',
                cursor: 'pointer',
                background: 'transparent',
                border: '2px solid var(--border)',
                color: 'var(--text-primary)',
                transition: 'all 0.2s'
              }}
            >
              View Architecture
            </button>
          </Link>
        </motion.div>

        {/* Flow Diagram */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ marginTop: '4rem', padding: '0 1rem' }}
        >
          <FlowDiagram />
        </motion.div>
      </div>
    </section>
  );
}

function FlowDiagram() {
  const steps = [
    { label: 'Query', icon: '💬' },
    { label: 'Route', icon: '🎯' },
    { label: 'Search', icon: '📚' },
    { label: 'Generate', icon: '🧠' },
    { label: 'Answer', icon: '✅' },
  ];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.label}>
          <div
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.75rem 1rem', 
              borderRadius: '0.75rem',
              background: 'var(--surface)', 
              border: '1px solid var(--border)' 
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{step.icon}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <span style={{ fontSize: '1.125rem', color: 'var(--text-tertiary)' }}>→</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
