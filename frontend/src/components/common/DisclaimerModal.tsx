'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface DisclaimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function DisclaimerModal({ isOpen, onClose, onAccept }: DisclaimerModalProps) {
  const { language } = useLanguage();
  const [agreed, setAgreed] = useState(false);

  const content = {
    vi: {
      title: 'Tuyên bố miễn trừ trách nhiệm',
      body: 'Các thông tin và phân tích từ MacroInsight Agent chỉ mang tính chất tham khảo dựa trên dữ liệu quá khứ. Chúng tôi không đưa ra khuyến nghị mua bán cụ thể. Nhà đầu tư tự chịu trách nhiệm với quyết định của mình.',
      checkbox: 'Tôi đã đọc và đồng ý',
      button: 'Tiếp tục'
    },
    en: {
      title: 'Disclaimer',
      body: 'Information and analysis from MacroInsight Agent are for reference only, based on historical data. We do not provide specific buy/sell recommendations. Investors are responsible for their own decisions.',
      checkbox: 'I have read and agree',
      button: 'Continue'
    }
  };

  const t = content[language];

  // Reset checkbox when modal closes
  useEffect(() => {
    if (!isOpen) {
      setAgreed(false);
    }
  }, [isOpen]);

  const handleAccept = () => {
    if (agreed) {
      onAccept();
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={(e) => {
              // Prevent closing by clicking backdrop
              e.stopPropagation();
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--card)',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '500px',
                width: '100%',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                border: '2px solid var(--warning)',
                position: 'relative'
              }}
            >
              {/* Warning Icon */}
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(255, 159, 28, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem'
              }}>
                <AlertTriangle size={32} color="var(--warning)" />
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: 700,
                textAlign: 'center',
                marginBottom: '1rem',
                color: 'var(--text-primary)',
                textTransform: 'uppercase'
              }}>
                {t.title}
              </h2>

              {/* Body */}
              <p style={{
                fontSize: '1rem',
                lineHeight: 1.8,
                color: 'var(--text-secondary)',
                marginBottom: '2rem',
                textAlign: 'center'
              }}>
                {t.body}
              </p>

              {/* Checkbox */}
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '1rem',
                background: 'var(--surface)',
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '1.5rem',
                border: '2px solid',
                borderColor: agreed ? 'var(--primary)' : 'var(--border)',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!agreed) {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!agreed) {
                  e.currentTarget.style.borderColor = 'var(--border)';
                }
              }}
              >
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={{
                    width: '20px',
                    height: '20px',
                    cursor: 'pointer',
                    accentColor: 'var(--primary)'
                  }}
                />
                <span style={{
                  fontSize: '0.938rem',
                  fontWeight: 600,
                  color: 'var(--text-primary)'
                }}>
                  {t.checkbox}
                </span>
              </label>

              {/* Continue Button */}
              <button
                onClick={handleAccept}
                disabled={!agreed}
                className="btn-primary"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: '15px',
                  opacity: agreed ? 1 : 0.5,
                  cursor: agreed ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (agreed) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 200, 5, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 200, 5, 0.15)';
                }}
              >
                {t.button}
              </button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
