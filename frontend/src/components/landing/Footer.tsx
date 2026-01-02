'use client';

import { Github } from 'lucide-react';
import { Logo } from '../shared/Logo';
import { APIStatus } from '@/components/common/APIStatus';

const techStack = [
  'Next.js',
  'LangGraph', 
  'FastAPI',
  'Supabase',
  'Gemini',
];

export function Footer() {
  return (
    <footer style={{ padding: '3rem 1rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
      <div style={{ width: '100%', maxWidth: '80rem', margin: '0 auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', alignItems: 'flex-start' }}>
          {/* Left - Logo & Description */}
          <div style={{ maxWidth: '28rem' }}>
            <Logo size="sm" showText={false} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              Multi-Index RAG for Vietnamese Financial & Legal AI. 
              A research-grade knowledge retrieval system.
            </p>
          </div>

          {/* Center - Tech Stack */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {techStack.map((tech) => (
              <span
                key={tech}
                style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  background: 'var(--background)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Right - Links & Status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <APIStatus />
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)', textDecoration: 'none', transition: 'opacity 0.2s' }}
            >
              <Github size={18} />
              <span>GitHub</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ marginTop: '2.5rem', paddingTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', borderTop: '1px solid var(--border)', color: 'var(--text-tertiary)' }}>
          © 2024 Multi-Index RAG. UEL Final Report Project.
        </div>
      </div>
    </footer>
  );
}
