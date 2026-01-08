/**
 * Personal Tab Component - Portfolio & Macro Alignment
 * Responsibility: Display portfolio with macro news impact analysis
 */
'use client';

import { useState } from 'react';
import { Portfolio, SynthesisReport } from '@/types/dashboard.types';
import { ArrowUp, ArrowDown, Edit2, Sparkles } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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

export function PersonalTab({ portfolio, report, onEditPortfolio }: PersonalTabProps) {
  const [showEditModal, setShowEditModal] = useState(false);

  // Prepare chart data
  const chartData = [
    ...portfolio.holdings.map(h => ({
      name: h.ticker,
      value: h.value,
      allocation: h.allocation,
    })),
    {
      name: 'Cash',
      value: portfolio.cash,
      allocation: (portfolio.cash / portfolio.totalValue) * 100,
    },
  ];

  const dailyChangeAmount = (portfolio.totalValue * portfolio.dailyChange) / 100;

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '40px 24px',
    }}>
      {/* Header - Total Asset Value */}
      <div style={{
        textAlign: 'center',
        marginBottom: '48px',
      }}>
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
          color: portfolio.dailyChange >= 0 ? '#10B981' : '#EF4444',
        }}>
          {portfolio.dailyChange >= 0 ? (
            <ArrowUp size={28} strokeWidth={3} />
          ) : (
            <ArrowDown size={28} strokeWidth={3} />
          )}
          <span>
            {portfolio.dailyChange >= 0 ? '+' : ''}{formatVND(dailyChangeAmount)} ({portfolio.dailyChange >= 0 ? '+' : ''}{portfolio.dailyChange.toFixed(2)}%)
          </span>
        </div>
      </div>

      {/* Donut Chart Section */}
      <div style={{
        background: 'var(--card)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--shadow-fintech)',
        marginBottom: '32px',
      }}>
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
              <div style={{
                fontSize: '24px',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}>
                {formatVND(portfolio.cash)} ₫
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
      </div>

      {/* AI Synthesis Report */}
      <div style={{
        background: 'var(--card)',
        borderRadius: '24px',
        padding: '32px',
        boxShadow: 'var(--shadow-fintech)',
        borderLeft: '4px solid var(--primary)',
      }}>
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
          {report.summary}
        </p>

        {/* Positives & Negatives Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
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
              {report.positives.map((positive, idx) => (
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
              {report.negatives.map((negative, idx) => (
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

        {/* Recommendation */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(0, 200, 5, 0.08)',
          borderRadius: '16px',
          borderLeft: '4px solid var(--primary)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
          }}>
            <span style={{ fontSize: '24px' }}>💡</span>
            <div>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#92400E',
                marginBottom: '4px',
              }}>
                Khuyến nghị
              </div>
              <div style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#78350F',
              }}>
                {report.recommendation}
              </div>
            </div>
          </div>
        </div>
      </div>

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
              backdropFilter: 'blur(8px)',
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
                {portfolio.holdings.map((holding) => (
                  <div
                    key={holding.ticker}
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
                        {holding.ticker}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        color: 'var(--text-secondary)',
                      }}>
                        {holding.name}
                      </div>
                    </div>
                    <input
                      type="number"
                      placeholder="Số lượng"
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
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'white',
                    color: 'var(--text-primary)',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => setShowEditModal(false)}
                >
                  Hủy
                </button>
                <button
                  className="btn-primary"
                  style={{
                    flex: 1,
                    padding: '12px',
                    fontSize: '15px',
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
    </div>
  );
}
