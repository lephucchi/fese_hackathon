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
      <main style={{ paddingTop: 'clamp(70px, 12vh, 100px)', paddingBottom: 'clamp(1rem, 3vw, 2rem)' }}>
        <div className="container" style={{ maxWidth: '900px', margin: '0 auto', padding: '0 clamp(0.75rem, 4vw, 1.5rem)' }}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ textAlign: 'center', marginBottom: 'clamp(24px, 6vw, 48px)' }}
          >
            <h1 style={{
              fontSize: 'clamp(1.75rem, 6vw, 3rem)',
              fontWeight: 800,
              marginBottom: '1rem',
              paddingTop: '0.25em',
              lineHeight: 1.5,
              background: 'linear-gradient(135deg, var(--primary) 0%, #00D906 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {t('about.title')}
            </h1>
          </motion.div>

          {/* Intro */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="card"
            style={{ marginBottom: 'clamp(16px, 4vw, 32px)', padding: 'clamp(16px, 4vw, 24px)' }}
          >
            <h2 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: 'var(--primary)',
              wordWrap: 'break-word'
            }}>
              {t('about.intro.title')}
            </h2>
            <p style={{
              fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              wordWrap: 'break-word'
            }}>
              {t('about.intro.content')}
            </p>
          </motion.section>

          {/* How It Helps */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card"
            style={{ marginBottom: 'clamp(16px, 4vw, 32px)', padding: 'clamp(16px, 4vw, 24px)' }}
          >
            <h2 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: 'var(--text-primary)',
              wordWrap: 'break-word'
            }}>
              {t('about.howItHelps.title')}
            </h2>
            <p style={{
              fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
              lineHeight: 1.7,
              color: 'var(--text-secondary)',
              wordWrap: 'break-word'
            }}>
              {t('about.howItHelps.content')}
            </p>
          </motion.section>

          {/* Features */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="card"
            style={{ marginBottom: 'clamp(16px, 4vw, 32px)', padding: 'clamp(16px, 4vw, 24px)' }}
          >
            <h2 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
              fontWeight: 700,
              marginBottom: 'clamp(0.75rem, 3vw, 1.5rem)',
              color: 'var(--text-primary)'
            }}>
              {t('about.features.title')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1.25rem)' }}>
              <div style={{
                padding: 'clamp(0.75rem, 3vw, 1.25rem)',
                background: 'var(--surface)',
                borderRadius: '12px',
                borderLeft: '4px solid var(--primary)'
              }}>
                <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {t('about.features.morning')}
                </p>
              </div>
              <div style={{
                padding: 'clamp(0.75rem, 3vw, 1.25rem)',
                background: 'var(--surface)',
                borderRadius: '12px',
                borderLeft: '4px solid #00D906'
              }}>
                <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {t('about.features.analysis')}
                </p>
              </div>
              <div style={{
                padding: 'clamp(0.75rem, 3vw, 1.25rem)',
                background: 'var(--surface)',
                borderRadius: '12px',
                borderLeft: '4px solid #FFD700'
              }}>
                <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {t('about.features.chat')}
                </p>
              </div>
              <div style={{
                padding: 'clamp(0.75rem, 3vw, 1.25rem)',
                background: 'var(--surface)',
                borderRadius: '12px',
                borderLeft: '4px solid #FF9F1C'
              }}>
                <p style={{ fontSize: 'clamp(0.8rem, 2.5vw, 1rem)', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {t('about.features.report')}
                </p>
              </div>
            </div>
          </motion.section>

          {/* Mission */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="card"
            style={{ marginBottom: 'clamp(16px, 4vw, 32px)', padding: 'clamp(16px, 4vw, 24px)' }}
          >
            <h2 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: 'var(--text-primary)'
            }}>
              {t('about.mission.title')}
            </h2>
            <p style={{
              fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
              lineHeight: 1.7,
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
            style={{ marginBottom: 'clamp(16px, 4vw, 32px)', padding: 'clamp(16px, 4vw, 24px)' }}
          >
            <h2 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
              fontWeight: 700,
              marginBottom: '0.75rem',
              color: 'var(--text-primary)'
            }}>
              {t('about.vision.title')}
            </h2>
            <p style={{
              fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
              lineHeight: 1.7,
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
            style={{ marginBottom: 'clamp(24px, 5vw, 48px)', padding: 'clamp(16px, 4vw, 24px)' }}
          >
            <h2 style={{
              fontSize: 'clamp(1.25rem, 4vw, 1.875rem)',
              fontWeight: 700,
              marginBottom: 'clamp(0.75rem, 3vw, 1.5rem)',
              color: 'var(--text-primary)'
            }}>
              {t('about.values.title')}
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(0.75rem, 2vw, 1.5rem)'
            }}
              className="values-grid"
            >
              <div style={{
                padding: 'clamp(0.75rem, 3vw, 1.5rem)',
                background: 'var(--surface)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <Shield size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                <h3 style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)', fontWeight: 600 }}>
                  {t('about.values.transparency')}
                </h3>
              </div>
              <div style={{
                padding: 'clamp(0.75rem, 3vw, 1.5rem)',
                background: 'var(--surface)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <Users size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                <h3 style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)', fontWeight: 600 }}>
                  {t('about.values.innovation')}
                </h3>
              </div>
              <div style={{
                padding: 'clamp(0.75rem, 3vw, 1.5rem)',
                background: 'var(--surface)',
                borderRadius: '12px',
                textAlign: 'center'
              }}>
                <Users size={32} color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                <h3 style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1.25rem)', fontWeight: 600 }}>
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
                transition: 'all 0.2s',
                background: 'var(--card)',
                border: '1px solid var(--border)'
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
                  <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                    {t('about.legal.privacy.content')}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Terms of Service Accordion */}
            <div
              className="card"
              style={{
                marginBottom: '16px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'var(--card)',
                border: '1px solid var(--border)'
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
                  <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                    {t('about.legal.terms.content')}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Disclaimer Accordion */}
            <div
              className="card"
              style={{
                marginBottom: '48px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                background: 'var(--card)',
                border: '1px solid var(--border)'
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
                  <div style={{ fontSize: '1rem', lineHeight: 1.8, color: 'var(--text-secondary)', whiteSpace: 'pre-line' }}>
                    {t('about.legal.disclaimer.content')}
                  </div>
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
              fontSize: 'clamp(1.5rem, 4vw, 2.25rem)',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: 'var(--text-primary)'
            }}>
              {t('about.team.title')}
            </h2>
            <p style={{
              fontSize: 'clamp(0.875rem, 3vw, 1.125rem)',
              color: 'var(--text-secondary)',
              marginBottom: 'clamp(1rem, 4vw, 2rem)'
            }}>
              {t('about.team.subtitle')}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 'clamp(0.5rem, 2vw, 2rem)'
            }}
              className="team-grid"
            >
              {[1, 2, 3, 4].map((member) => (
                <div
                  key={member}
                  className="card"
                  style={{
                    textAlign: 'center',
                    padding: 'clamp(0.75rem, 3vw, 2rem) clamp(0.5rem, 2vw, 1rem)'
                  }}
                >
                  <div style={{
                    width: 'clamp(50px, 15vw, 100px)',
                    height: 'clamp(50px, 15vw, 100px)',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #00D906 100%)',
                    margin: '0 auto clamp(0.5rem, 2vw, 1rem)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: 'clamp(1rem, 4vw, 2rem)',
                    fontWeight: 700
                  }}>
                    {member}
                  </div>
                  <h3 style={{ fontSize: 'clamp(0.75rem, 2.5vw, 1.25rem)', fontWeight: 600, marginBottom: '0.25rem' }}>
                    Team Member
                  </h3>
                  <p style={{ fontSize: 'clamp(0.6rem, 2vw, 0.875rem)', color: 'var(--text-tertiary)' }}>
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
