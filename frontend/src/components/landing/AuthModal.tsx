'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (activeTab === 'login') {
        await login(email, password);
        onClose();
      } else {
        // Validation for signup
        if (!firstName.trim()) {
          setError(t('auth.errors.firstNameRequired') as string);
          return;
        }
        if (!lastName.trim()) {
          setError(t('auth.errors.lastNameRequired') as string);
          return;
        }
        if (password !== confirmPassword) {
          setError(t('auth.errors.passwordMismatch') as string);
          return;
        }
        if (password.length < 8) {
          setError(t('auth.errors.passwordMinLength') as string);
          return;
        }
        // Validate password strength
        if (!/[A-Z]/.test(password)) {
          setError(t('auth.errors.passwordUppercase') as string);
          return;
        }
        if (!/[a-z]/.test(password)) {
          setError(t('auth.errors.passwordLowercase') as string);
          return;
        }
        if (!/\d/.test(password)) {
          setError(t('auth.errors.passwordNumber') as string);
          return;
        }

        // Use displayName or auto-generate from first + last name
        const finalDisplayName = displayName.trim() || `${firstName.trim()} ${lastName.trim()}`;

        await register(email, password, firstName.trim(), lastName.trim(), finalDisplayName);
        onClose();
      }
    } catch (err: unknown) {
      // Handle different error formats
      if (err instanceof Error) {
        // Check for validation errors
        const message = err.message;
        if (message.includes('uppercase')) {
          setError(t('auth.errors.passwordUppercase') as string);
        } else if (message.includes('lowercase')) {
          setError(t('auth.errors.passwordLowercase') as string);
        } else if (message.includes('number')) {
          setError(t('auth.errors.passwordNumber') as string);
        } else if (message.includes('already exists') || message.includes('duplicate')) {
          setError(t('auth.errors.emailExists') as string);
        } else {
          setError(message);
        }
      } else {
        setError(t('auth.errors.generic') as string);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 'clamp(0.5rem, 3vw, 1rem)'
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--card)',
                borderRadius: 'clamp(16px, 3vw, 24px)',
                padding: 'clamp(1.5rem, 4vw, 3rem)',
                maxWidth: '480px',
                width: '100%',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '1px solid var(--border)',
                position: 'relative'
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                style={{
                  position: 'absolute',
                  top: 'clamp(0.75rem, 2vw, 1.5rem)',
                  right: 'clamp(0.75rem, 2vw, 1.5rem)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)',
                  padding: '0.5rem',
                  borderRadius: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--surface)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <X size={24} />
              </button>

              {/* Logo/Title */}
              <h2
                style={{
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                  fontWeight: 800,
                  marginBottom: '0.25rem',
                  color: 'var(--text-primary)',
                  textAlign: 'center'
                }}
              >
                MacroInsight
              </h2>
              <p
                style={{
                  fontSize: 'clamp(0.75rem, 2.5vw, 1rem)',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  marginBottom: 'clamp(1rem, 3vw, 2rem)'
                }}
              >
                {t('auth.tagline')}
              </p>

              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.25rem',
                  marginBottom: 'clamp(1rem, 3vw, 2rem)',
                  background: 'var(--surface)',
                  padding: 'clamp(0.25rem, 1vw, 0.5rem)',
                  borderRadius: '12px'
                }}
              >
                <button
                  onClick={() => {
                    setActiveTab('login');
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                    background: activeTab === 'login' ? 'var(--card)' : 'transparent',
                    color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === 'login' ? 'var(--shadow-md)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('auth.login')}
                </button>
                <button
                  onClick={() => {
                    setActiveTab('signup');
                    setError('');
                  }}
                  style={{
                    flex: 1,
                    padding: 'clamp(0.5rem, 2vw, 0.75rem)',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 'clamp(0.8rem, 2.5vw, 1rem)',
                    background: activeTab === 'signup' ? 'var(--card)' : 'transparent',
                    color: activeTab === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === 'signup' ? 'var(--shadow-md)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  {t('auth.createAccount')}
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    padding: '0.875rem',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  <AlertCircle size={18} style={{ color: '#EF4444', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.875rem', color: '#EF4444' }}>{error}</span>
                </div>
              )}

              {/* Form */}
              <form
                onSubmit={handleSubmit}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Name Inputs - Only for signup */}
                {activeTab === 'signup' && (
                  <>
                    {/* First Name & Last Name Row */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      {/* First Name */}
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {t('auth.firstName')} <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <User
                            size={20}
                            style={{
                              position: 'absolute',
                              left: '1rem',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-tertiary)'
                            }}
                          />
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder={t('auth.placeholders.firstName') as string}
                            style={{
                              width: '100%',
                              padding: '0.875rem 1rem 0.875rem 3rem',
                              borderRadius: '12px',
                              border: '1.5px solid var(--border)',
                              background: 'var(--surface)',
                              fontSize: '1rem',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>
                      </div>

                      {/* Last Name */}
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: '0.5rem',
                            fontSize: '0.875rem',
                            fontWeight: 600,
                            color: 'var(--text-primary)'
                          }}
                        >
                          {t('auth.lastName')} <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder={t('auth.placeholders.lastName') as string}
                            style={{
                              width: '100%',
                              padding: '0.875rem 1rem',
                              borderRadius: '12px',
                              border: '1.5px solid var(--border)',
                              background: 'var(--surface)',
                              fontSize: '1rem',
                              color: 'var(--text-primary)'
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: '0.5rem',
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: 'var(--text-primary)'
                        }}
                      >
                        {t('auth.displayName')} <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>({t('auth.optional')})</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <User
                          size={20}
                          style={{
                            position: 'absolute',
                            left: '1rem',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--text-tertiary)'
                          }}
                        />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={t('auth.placeholders.displayName') as string}
                          style={{
                            width: '100%',
                            padding: '0.875rem 1rem 0.875rem 3rem',
                            borderRadius: '12px',
                            border: '1.5px solid var(--border)',
                            background: 'var(--surface)',
                            fontSize: '1rem',
                            color: 'var(--text-primary)'
                          }}
                        />
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem' }}>
                        {t('auth.displayNameHint')}
                      </p>
                    </div>
                  </>
                )}

                {/* Email Input */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {t('auth.email')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail
                      size={20}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)'
                      }}
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('auth.placeholders.email') as string}
                      style={{
                        width: '100%',
                        padding: '0.875rem 1rem 0.875rem 3rem',
                        borderRadius: '12px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        fontSize: '1rem',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '0.5rem',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {t('auth.password')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock
                      size={20}
                      style={{
                        position: 'absolute',
                        left: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--text-tertiary)'
                      }}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '0.875rem 3rem 0.875rem 3rem',
                        borderRadius: '12px',
                        border: '1.5px solid var(--border)',
                        background: 'var(--surface)',
                        fontSize: '1rem',
                        color: 'var(--text-primary)'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '1rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-tertiary)',
                        padding: 0
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {/* Password requirements hint - only for signup */}
                  {activeTab === 'signup' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                      {t('auth.passwordHint')}
                    </p>
                  )}
                </div>

                {/* Confirm Password - Only for signup */}
                {activeTab === 'signup' && (
                  <div>
                    <label
                      style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)'
                      }}
                    >
                      {t('auth.confirmPassword')}
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock
                        size={20}
                        style={{
                          position: 'absolute',
                          left: '1rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: 'var(--text-tertiary)'
                        }}
                      />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        style={{
                          width: '100%',
                          padding: '0.875rem 1rem 0.875rem 3rem',
                          borderRadius: '12px',
                          border: '1.5px solid var(--border)',
                          background: 'var(--surface)',
                          fontSize: '1rem',
                          color: 'var(--text-primary)'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Forgot Password - Only for login */}
                {activeTab === 'login' && (
                  <div style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--primary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {t('auth.forgotPassword')}
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="interactive-scale"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: isLoading ? 'var(--surface)' : 'var(--primary)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    boxShadow: isLoading ? 'none' : '0 4px 16px rgba(0, 200, 5, 0.25)',
                    transition: 'all 0.2s',
                    opacity: isLoading ? 0.6 : 1
                  }}
                >
                  {isLoading ? t('auth.processing') : (activeTab === 'login' ? t('auth.login') : t('auth.createAccount'))}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
