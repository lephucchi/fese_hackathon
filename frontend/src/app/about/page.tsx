'use client';

import { useState } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronDown, Shield, FileText, AlertTriangle, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AboutPage() {
  const { t } = useLanguage();
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', width: '100%' }}>
      <Navigation />
      <main style={{ paddingTop: 'clamp(80px, 15vh, 100px)', paddingBottom: 'clamp(1rem, 3vw, 2rem)' }}>
        <div className="container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 clamp(1rem, 3vw, 1.5rem)' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: 'clamp(32px, 8vw, 64px)' }}
          >
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3rem)',
              fontWeight: 800,
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, var(--primary) 0%, #00D906 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {t('about.title')}
            </h1>
          </motion.div>

          {/* Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{ marginBottom: '32px' }}
          >
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              {t('about.mission.title')}
            </h2>
            <p style={{
              fontSize: '1.125rem',
              lineHeight: 1.8,
              color: 'var(--text-secondary)'
            }}>
              {t('about.mission.content')}
            </p>
          </motion.section>

          {/* Vision */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            style={{ marginBottom: '32px' }}
          >
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              marginBottom: '1rem',
              color: 'var(--text-primary)'
            }}>
              {t('about.vision.title')}
            </h2>
            <p style={{
              fontSize: '1.125rem',
              lineHeight: 1.8,
              color: 'var(--text-secondary)'
            }}>
              {t('about.vision.content')}
            </p>
          </motion.section>

          {/* Core Values */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="card"
            style={{ marginBottom: '48px' }}
          >
            <h2 style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              color: 'var(--text-primary)'
            }}>
              {t('about.values.title')}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1.5rem'
            }}>
              <div style={{
                padding: '1.5rem',
                background: 'var(--surface)',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <Shield size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {t('about.values.transparency')}
                </h3>
              </div>
              <div style={{
                padding: '1.5rem',
                background: 'var(--surface)',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <Users size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {t('about.values.innovation')}
                </h3>
              </div>
              <div style={{
                padding: '1.5rem',
                background: 'var(--surface)',
                borderRadius: '16px',
                textAlign: 'center'
              }}>
                <Users size={40} color="var(--primary)" style={{ margin: '0 auto 1rem' }} />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {t('about.values.userFirst')}
                </h3>
              </div>
            </div>
          </motion.section>

          {/* Legal & Compliance */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              marginBottom: '1.5rem',
              color: 'var(--text-primary)',
              textAlign: 'center'
            }}>
              {t('about.legal.title')}
            </h2>

            {/* Privacy Policy Accordion */}
            <div
              className="card"
              style={{
                marginBottom: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => toggleSection('privacy')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <Shield size={24} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('about.legal.privacy.title')}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === 'privacy' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={24} color="var(--text-secondary)" />
                </motion.div>
              </div>
              {expandedSection === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    {t('about.legal.privacy.content')}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Terms of Service Accordion */}
            <div
              className="card"
              style={{
                marginBottom: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => toggleSection('terms')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <FileText size={24} color="var(--primary)" />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('about.legal.terms.title')}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === 'terms' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={24} color="var(--text-secondary)" />
                </motion.div>
              </div>
              {expandedSection === 'terms' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    {t('about.legal.terms.content')}
                  </p>
                </motion.div>
              )}
            </div>

            {/* Disclaimer Accordion */}
            <div
              className="card"
              style={{
                marginBottom: '48px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onClick={() => toggleSection('disclaimer')}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <AlertTriangle size={24} color="var(--warning)" />
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {t('about.legal.disclaimer.title')}
                  </h3>
                </div>
                <motion.div
                  animate={{ rotate: expandedSection === 'disclaimer' ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown size={24} color="var(--text-secondary)" />
                </motion.div>
              </div>
              {expandedSection === 'disclaimer' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{
                    marginTop: '1rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)'
                  }}
                >
                  <p style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)' }}>
                    {t('about.legal.disclaimer.content')}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.section>

          {/* Team Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{ textAlign: 'center' }}
          >
            <h2 style={{
              fontSize: '2.25rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              {t('about.team.title')}
            </h2>
            <p style={{
              fontSize: '1.125rem',
              color: 'var(--text-secondary)',
              marginBottom: '2rem'
            }}>
              {t('about.team.subtitle')}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '2rem'
            }}>
              {[1, 2, 3, 4].map((member) => (
                <div
                  key={member}
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: '2rem 1rem'
                  }}
                >
                  <div style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #00D906 100%)',
                    margin: '0 auto 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '2rem',
                    fontWeight: 700
                  }}>
                    {member}
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Team Member
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                    Position
                  </p>
                </div>
              ))}
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
