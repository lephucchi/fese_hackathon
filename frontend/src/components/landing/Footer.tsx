'use client';

import { TrendingUp } from 'lucide-react';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border)',
      padding: '64px 0 32px',
      background: 'var(--glass-bg)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '48px',
          marginBottom: '48px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <TrendingUp size={28} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '22px', fontWeight: '700', color: 'var(--text-primary)' }}>
                MacroInsight
              </span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6' }}>
              Nền tảng phân tích và tổng hợp tin tức kinh tế vĩ mô thông minh
            </p>
          </div>

          <div>
            <h3 style={{ 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: 'var(--text-primary)',
              fontSize: '16px'
            }}>
              Sản phẩm
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }} 
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Tính năng
                </a>
              </li>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Cách hoạt động
                </a>
              </li>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Bảng giá
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: 'var(--text-primary)',
              fontSize: '16px'
            }}>
              Công ty
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Về chúng tôi
                </a>
              </li>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Blog
                </a>
              </li>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Liên hệ
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 style={{ 
              fontWeight: '600', 
              marginBottom: '20px', 
              color: 'var(--text-primary)',
              fontSize: '16px'
            }}>
              Pháp lý
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Chính sách bảo mật
                </a>
              </li>
              <li>
                <a href="#" style={{ 
                  color: 'var(--text-secondary)', 
                  textDecoration: 'none', 
                  fontSize: '15px',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}>
                  Điều khoản dịch vụ
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div style={{
          paddingTop: '32px',
          borderTop: '1px solid var(--border)',
          textAlign: 'center',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          © {new Date().getFullYear()} MacroInsight. Designed with ❤️ in Vietnam.
        </div>
      </div>
    </footer>
  );
}
