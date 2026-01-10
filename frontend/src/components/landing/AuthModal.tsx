'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Lock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login, register } = useAuth();
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
          setError('Vui lòng nhập họ');
          return;
        }
        if (!lastName.trim()) {
          setError('Vui lòng nhập tên');
          return;
        }
        if (password !== confirmPassword) {
          setError('Mật khẩu xác nhận không khớp');
          return;
        }
        if (password.length < 8) {
          setError('Mật khẩu phải có ít nhất 8 ký tự');
          return;
        }
        // Validate password strength
        if (!/[A-Z]/.test(password)) {
          setError('Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)');
          return;
        }
        if (!/[a-z]/.test(password)) {
          setError('Mật khẩu phải có ít nhất 1 chữ thường (a-z)');
          return;
        }
        if (!/\d/.test(password)) {
          setError('Mật khẩu phải có ít nhất 1 số (0-9)');
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
          setError('Mật khẩu phải có ít nhất 1 chữ hoa (A-Z)');
        } else if (message.includes('lowercase')) {
          setError('Mật khẩu phải có ít nhất 1 chữ thường (a-z)');
        } else if (message.includes('number')) {
          setError('Mật khẩu phải có ít nhất 1 số (0-9)');
        } else if (message.includes('already exists') || message.includes('duplicate')) {
          setError('Email đã được sử dụng');
        } else {
          setError(message);
        }
      } else {
        setError('Đã có lỗi xảy ra');
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
                Đầu tư thông minh hơn mỗi ngày
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
                  Đăng nhập
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
                  Tạo tài khoản
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
                          Họ <span style={{ color: '#EF4444' }}>*</span>
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
                            placeholder="Nguyễn"
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
                          Tên <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="text"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            placeholder="Văn A"
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
                        Tên hiển thị <span style={{ color: 'var(--text-tertiary)', fontWeight: 400 }}>(tùy chọn)</span>
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
                          placeholder="Nickname hoặc để trống"
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
                        Nếu để trống, sẽ sử dụng Họ + Tên làm tên hiển thị
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
                  {/* Password requirements hint - only for signup */}
                  {activeTab === 'signup' && (
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                      Tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số
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
                  {isLoading ? 'Đang xử lý...' : (activeTab === 'login' ? 'Đăng nhập' : 'Tạo tài khoản')}
                </button>
              </form>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
