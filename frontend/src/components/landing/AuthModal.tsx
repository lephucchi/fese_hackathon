'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
              backdropFilter: 'blur(8px)',
              zIndex: 999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
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
                borderRadius: '24px',
                padding: '3rem',
                maxWidth: '480px',
                width: '100%',
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
                  top: '1.5rem',
                  right: '1.5rem',
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
                  fontSize: '2rem',
                  fontWeight: 800,
                  marginBottom: '0.5rem',
                  color: 'var(--text-primary)',
                  textAlign: 'center'
                }}
              >
                MacroInsight
              </h2>
              <p
                style={{
                  fontSize: '1rem',
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  marginBottom: '2rem'
                }}
              >
                Đầu tư thông minh hơn mỗi ngày
              </p>

              {/* Tabs */}
              <div
                style={{
                  display: 'flex',
                  gap: '0.5rem',
                  marginBottom: '2rem',
                  background: 'var(--surface)',
                  padding: '0.5rem',
                  borderRadius: '12px'
                }}
              >
                <button
                  onClick={() => setActiveTab('login')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: activeTab === 'login' ? 'var(--card)' : 'transparent',
                    color: activeTab === 'login' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === 'login' ? 'var(--shadow-md)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  onClick={() => setActiveTab('signup')}
                  style={{
                    flex: 1,
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '1rem',
                    background: activeTab === 'signup' ? 'var(--card)' : 'transparent',
                    color: activeTab === 'signup' ? 'var(--text-primary)' : 'var(--text-secondary)',
                    boxShadow: activeTab === 'signup' ? 'var(--shadow-md)' : 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  Tạo tài khoản
                </button>
              </div>

              {/* Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Handle auth
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
              >
                {/* Name Input - Only for signup */}
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
                      Họ và tên
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
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Nguyễn Văn A"
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
                    Email
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
                      placeholder="your@email.com"
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
                    Mật khẩu
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
                      Xác nhận mật khẩu
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
                      Quên mật khẩu?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  className="interactive-scale"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--primary)',
                    color: 'white',
                    fontSize: '1rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(0, 200, 5, 0.25)',
                    transition: 'all 0.2s'
                  }}
                >
                  {activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
                </button>
              </form>

              {/* Divider */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  margin: '2rem 0',
                  gap: '1rem'
                }}
              >
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                  hoặc
                </span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border)' }} />
              </div>

              {/* Social Login */}
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Google
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '0.875rem',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--card)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--surface)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
