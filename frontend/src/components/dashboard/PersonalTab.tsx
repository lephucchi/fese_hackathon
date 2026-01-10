/**
 * Personal Tab Component - Profile, Portfolio & Macro Alignment
 * Responsibility: Display user profile, portfolio with macro news impact analysis
 */
'use client';

import { useState, useEffect } from 'react';
import { Portfolio, SynthesisReport } from '@/types/dashboard.types';
import { ArrowUp, ArrowDown, Edit2, Sparkles, User, Mail, Shield, Crown, Star, Zap } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useDisclaimer } from '@/hooks/useDisclaimer';
import { DisclaimerModal } from '@/components/common/DisclaimerModal';
import { useAuth } from '@/hooks/useAuth';

interface PersonalTabProps {
  readonly portfolio: Portfolio;
  readonly report: SynthesisReport;
  readonly onEditPortfolio: () => void;
}

// Format currency helper
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

// Chart colors - Green theme matching primary color
const COLORS: Record<string, string> = {
  HPG: '#00C805',  // Primary Green
  SSI: '#00A004',  // Dark Green
  VCB: '#33D433',  // Light Green
  VHM: '#10B981',  // Emerald
  VNM: '#059669',  // Teal
  Cash: '#9CA3AF', // Gray
};

// Tier configuration
const TIER_CONFIG: Record<number, { name: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  1: {
    name: 'Normal',
    color: '#6B7280',
    bgColor: 'rgba(107, 114, 128, 0.1)',
    icon: <User size={14} />
  },
  2: {
    name: 'Pro',
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    icon: <Star size={14} />
  },
  3: {
    name: 'Business',
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    icon: <Zap size={14} />
  },
  4: {
    name: 'Admin',
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    icon: <Crown size={14} />
  },
};

export function PersonalTab({ portfolio, report, onEditPortfolio }: PersonalTabProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [viewingInsights, setViewingInsights] = useState(false);
  const { hasAccepted, isLoading: disclaimerLoading, acceptDisclaimer } = useDisclaimer();
  const { user, isAuthenticated } = useAuth();

  // Check if user wants to view AI insights
  useEffect(() => {
    if (viewingInsights && !disclaimerLoading && !hasAccepted) {
      setShowDisclaimer(true);
    }
  }, [viewingInsights, disclaimerLoading, hasAccepted]);

  // Prepare chart data
  const chartData = portfolio.positions.map(p => ({
    name: p.symbol,
    value: p.currentPrice * p.quantity,
    allocation: ((p.currentPrice * p.quantity) / portfolio.totalValue) * 100,
  }));

  const dailyChangeAmount = portfolio.todayProfitLoss;

  // Get tier info
  const tierInfo = user?.role?.role_id ? TIER_CONFIG[user.role.role_id] : TIER_CONFIG[1];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px',
    }}>
      {/* Profile Card - NEW */}
      {isAuthenticated && user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'var(--card)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: 'var(--shadow-fintech)',
            marginBottom: '32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background decoration */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(0, 200, 5, 0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '28px',
          }}>
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: 0,
            }}>
              Hồ sơ cá nhân
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            gap: '40px',
            alignItems: 'center',
          }}>
            {/* Avatar Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px',
            }}>
              {/* Avatar Image */}
              <div style={{
                position: 'relative',
              }}>
                <div style={{
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid var(--primary)',
                  boxShadow: '0 8px 24px rgba(0, 200, 5, 0.25)',
                }}>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={user.display_name || 'Avatar'}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                    />
                  ) : (
                    <div style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, var(--primary) 0%, #4ADE80 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '3rem',
                      fontWeight: 700,
                      color: 'white',
                    }}>
                      {user.display_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Online indicator */}
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: '#10B981',
                  border: '3px solid var(--card)',
                }} />
              </div>

              {/* Tier Badge */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '9999px',
                background: tierInfo.bgColor,
                border: `1px solid ${tierInfo.color}`,
              }}>
                <span style={{ color: tierInfo.color }}>{tierInfo.icon}</span>
                <span style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: tierInfo.color,
                }}>
                  {tierInfo.name}
                </span>
              </div>
            </div>

            {/* Info Section */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}>
              {/* Name Row */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '24px',
              }}>
                {/* First Name */}
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Họ
                  </div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {user.first_name || '—'}
                  </div>
                </div>

                {/* Last Name */}
                <div>
                  <div style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'var(--text-secondary)',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}>
                    Tên
                  </div>
                  <div style={{
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {user.last_name || '—'}
                  </div>
                </div>
              </div>

              {/* Display Name */}
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Tên hiển thị
                </div>
                <div style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <User size={18} style={{ color: 'var(--primary)' }} />
                  {user.display_name || user.email.split('@')[0]}
                </div>
              </div>

              {/* Email */}
              <div>
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                  marginBottom: '6px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  Email
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 500,
                  color: 'var(--text-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                  {user.email}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Header - Total Asset Value */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          textAlign: 'center',
          marginBottom: '48px',
        }}
      >
        <div style={{
          fontSize: '0.875rem',
          fontWeight: 500,
          color: 'var(--text-secondary)',
          marginBottom: '8px',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}>
          Tổng giá trị tài sản
        </div>
        <div style={{
          fontSize: '3.75rem',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          color: 'var(--text-primary)',
          marginBottom: '12px',
          lineHeight: 1,
        }}>
          {formatVND(portfolio.totalValue)} ₫
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '1.5rem',
          fontWeight: 600,
          color: portfolio.todayProfitLossPercent >= 0 ? '#10B981' : '#EF4444',
        }}>
          {portfolio.todayProfitLossPercent >= 0 ? (
            <ArrowUp size={28} strokeWidth={3} />
          ) : (
            <ArrowDown size={28} strokeWidth={3} />
          )}
          <span>
            {portfolio.todayProfitLossPercent >= 0 ? '+' : ''}{formatVND(dailyChangeAmount)} ({portfolio.todayProfitLossPercent >= 0 ? '+' : ''}{portfolio.todayProfitLossPercent.toFixed(2)}%)
          </span>
        </div>
      </motion.div>

      {/* Donut Chart Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          background: 'var(--card)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: 'var(--shadow-fintech)',
          marginBottom: '32px',
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            Phân bổ danh mục
          </h2>
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--surface)';
              e.currentTarget.style.borderColor = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--card)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Edit2 size={16} />
            Chỉnh sửa
          </button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '48px',
          alignItems: 'center',
        }}>
          {/* Donut Chart */}
          <div style={{ position: 'relative', height: '350px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={140}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.name] || '#9CA3AF'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            {/* Center Label */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginBottom: '4px',
              }}>
                Sức mua
              </div>
            </div>
          </div>

          {/* Legend */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}>
            {chartData.map((item) => (
              <div
                key={item.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '4px',
                    background: COLORS[item.name] || '#9CA3AF',
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                  }}>
                    {item.name}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--text-secondary)',
                  }}>
                    {formatVND(item.value)} ₫
                  </div>
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                }}>
                  {item.allocation.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* AI Synthesis Report */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        style={{
          background: 'var(--card)',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: 'var(--shadow-fintech)',
          borderLeft: '4px solid var(--primary)',
          cursor: hasAccepted ? 'default' : 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          overflow: 'hidden'
        }}
        onClick={() => {
          if (!hasAccepted) {
            setViewingInsights(true);
          }
        }}
        onMouseEnter={(e) => {
          if (!hasAccepted) {
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 200, 5, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'var(--shadow-fintech)';
        }}
      >
        {/* Locked overlay if disclaimer not accepted */}
        {!hasAccepted && (
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
            borderRadius: '24px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '2rem'
            }}>
              <Sparkles size={48} style={{ color: 'var(--primary)', margin: '0 auto 1rem' }} />
              <p style={{
                fontSize: '1.125rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: '0.5rem'
              }}>
                Click để xem AI Insights
              </p>
              <p style={{
                fontSize: '0.875rem',
                color: 'var(--text-secondary)'
              }}>
                Yêu cầu đồng ý điều khoản
              </p>
            </div>
          </div>
        )}

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '24px',
        }}>
          <Sparkles size={28} style={{ color: 'var(--primary)' }} />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            Góc nhìn AI hôm nay
          </h2>
        </div>

        {/* Summary */}
        <p style={{
          fontSize: '16px',
          lineHeight: '1.6',
          color: 'var(--text-secondary)',
          marginBottom: '32px',
        }}>
          {report.overview}
        </p>

        {/* Positives & Negatives Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
        }}>
          {/* Positives */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#10B981',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              🟢 Tích cực
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {report.positiveFactors.map((positive, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(0, 200, 5, 0.05)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(0, 200, 5, 0.2)',
                  }}
                >
                  • {positive}
                </li>
              ))}
            </ul>
          </div>

          {/* Negatives */}
          <div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#EF4444',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              🔴 Rủi ro
            </h3>
            <ul style={{
              listStyle: 'none',
              padding: 0,
              margin: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}>
              {report.negativeFactors.map((negative, idx) => (
                <li
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(255, 90, 95, 0.05)',
                    borderRadius: '12px',
                    fontSize: '15px',
                    lineHeight: '1.5',
                    color: 'var(--text-primary)',
                    border: '1px solid rgba(255, 90, 95, 0.2)',
                  }}
                >
                  • {negative}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Floating Action Button */}
      <Link href="/chat" style={{ textDecoration: 'none' }}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '16px 24px',
            borderRadius: '9999px',
            background: 'linear-gradient(135deg, var(--primary) 0%, #00a004 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0, 200, 5, 0.4)',
            zIndex: 100,
          }}
        >
          <Sparkles size={20} />
          Hỏi AI về Danh mục
        </motion.button>
      </Link>

      {/* Edit Portfolio Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--card)',
                borderRadius: '24px',
                padding: '32px',
                maxWidth: '600px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
              }}
            >
              <h2 style={{
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: '24px',
                color: 'var(--text-primary)',
              }}>
                Cập nhật danh mục
              </h2>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                marginBottom: '24px',
              }}>
                {portfolio.positions.map((position) => (
                  <div
                    key={position.symbol}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '16px',
                      background: 'var(--surface)',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                      }}>
                        {position.symbol}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                      }}>
                        Số lượng: {position.quantity}
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="Số lượng"
                      defaultValue={position.quantity}
                      style={{
                        width: '120px',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        fontSize: '14px',
                      }}
                    />
                  </div>
                ))}
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
              }}>
                <button
                  className="dark:bg-gray-700 dark:text-white"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    background: '#F3F4F6',
                    color: '#1F2937',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#E5E7EB'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#F3F4F6'}
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '15px',
                    fontWeight: 600,
                    borderRadius: '16px',
                    background: 'var(--primary)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => {
                    setShowEditModal(false);
                    // Save logic here
                  }}
                >
                  Lưu danh mục
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer Modal for AI Insights */}
      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => setShowDisclaimer(false)}
        onAccept={() => {
          acceptDisclaimer();
          setViewingInsights(false);
        }}
      />
    </div>
  );
}
