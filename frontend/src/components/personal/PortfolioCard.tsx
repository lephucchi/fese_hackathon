/**
 * PortfolioCard - Display portfolio with donut chart using real API
 */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Loader2, TrendingUp, AlertCircle, LogIn } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import { AddPositionForm } from './AddPositionForm';
import { CreatePositionData, PortfolioItem } from '@/services/api/portfolio.service';

// Dynamic colors for chart
const CHART_COLORS = [
    '#00C805',  // Primary Green
    '#00A004',  // Dark Green
    '#33D433',  // Light Green
    '#10B981',  // Emerald
    '#059669',  // Teal
    '#0D9488',  // Cyan
    '#0891B2',  // Sky
    '#3B82F6',  // Blue
];

// Format currency helper
const formatVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};

export function PortfolioCard() {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { portfolio, isLoading, error, addNewPosition, removePosition } = usePortfolio();
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleAddPosition = async (data: CreatePositionData) => {
        setIsSubmitting(true);
        try {
            await addNewPosition(data);
            setShowAddForm(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePosition = async (item: PortfolioItem) => {
        if (!confirm(`Xác nhận xóa ${item.ticker} khỏi danh mục?`)) return;

        setDeletingId(item.portfolio_id);
        try {
            await removePosition(item.portfolio_id);
        } finally {
            setDeletingId(null);
        }
    };

    // Not authenticated - show login prompt
    if (!authLoading && !isAuthenticated) {
        return (
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <TrendingUp size={24} style={{ color: 'var(--primary)' }} />
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                    }}>
                        Phân bổ danh mục
                    </h2>
                </div>
                <div style={{
                    textAlign: 'center',
                    padding: '48px 24px',
                    border: '2px dashed var(--border)',
                    borderRadius: '16px',
                    background: 'var(--surface)',
                }}>
                    <LogIn size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                    }}>
                        Vui lòng đăng nhập
                    </h3>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '0',
                    }}>
                        Đăng nhập để xem và quản lý danh mục đầu tư của bạn
                    </p>
                </div>
            </motion.div>
        );
    }

    // Loading state (auth or portfolio)
    if (authLoading || isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    background: 'var(--card)',
                    borderRadius: '24px',
                    padding: '48px',
                    boxShadow: 'var(--shadow-fintech)',
                    marginBottom: '32px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    color: 'var(--text-secondary)',
                }}
            >
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                <span>Đang tải danh mục...</span>
            </motion.div>
        );
    }

    // Prepare chart data
    const chartData = portfolio?.items.map((item, index) => ({
        name: item.ticker,
        value: item.market_value,
        allocation: item.allocation_percent,
        color: CHART_COLORS[index % CHART_COLORS.length],
    })) || [];

    const totalValue = portfolio?.total_value || 0;
    const hasPortfolio = portfolio?.has_portfolio || false;

    return (
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
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <TrendingUp size={24} style={{ color: 'var(--primary)' }} />
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                    }}>
                        Phân bổ danh mục
                    </h2>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        borderRadius: '12px',
                        border: '1px solid var(--primary)',
                        background: showAddForm ? 'var(--primary)' : 'transparent',
                        color: showAddForm ? 'white' : 'var(--primary)',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                    }}
                >
                    <Plus size={16} />
                    {showAddForm ? 'Đóng' : 'Thêm mã'}
                </button>
            </div>

            {/* Error display */}
            {error && (
                <div style={{
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#EF4444',
                    fontSize: '14px',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            {/* Add Position Form */}
            <AnimatePresence>
                {showAddForm && (
                    <AddPositionForm
                        onSubmit={handleAddPosition}
                        onCancel={() => setShowAddForm(false)}
                        isLoading={isSubmitting}
                    />
                )}
            </AnimatePresence>

            {/* Empty State */}
            {!hasPortfolio && !showAddForm && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                        textAlign: 'center',
                        padding: '48px 24px',
                        border: '2px dashed var(--border)',
                        borderRadius: '16px',
                        background: 'var(--surface)',
                    }}
                >
                    <TrendingUp size={48} style={{ color: 'var(--text-secondary)', marginBottom: '16px' }} />
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                    }}>
                        Chưa có danh mục đầu tư
                    </h3>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '20px',
                    }}>
                        Thêm các mã cổ phiếu để theo dõi danh mục của bạn
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        <Plus size={18} />
                        Thêm mã đầu tiên
                    </button>
                </motion.div>
            )}

            {/* Portfolio Chart & Legend */}
            {hasPortfolio && (
                <>
                    {/* Total Value Header */}
                    <div style={{
                        textAlign: 'center',
                        marginBottom: '32px',
                        padding: '24px',
                        background: 'var(--surface)',
                        borderRadius: '16px',
                    }}>
                        <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'var(--text-secondary)',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}>
                            Tổng giá trị danh mục
                        </div>
                        <div style={{
                            fontSize: '2.5rem',
                            fontWeight: 800,
                            letterSpacing: '-0.03em',
                            color: 'var(--primary)',
                            lineHeight: 1,
                        }}>
                            {formatVND(totalValue)} ₫
                        </div>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        gap: '48px',
                        alignItems: 'center',
                    }}>
                        {/* Donut Chart */}
                        <div style={{ position: 'relative', height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={120}
                                        paddingAngle={3}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
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
                                    fontSize: '24px',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                }}>
                                    {portfolio?.position_count || 0}
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    color: 'var(--text-secondary)',
                                }}>
                                    mã
                                </div>
                            </div>
                        </div>

                        {/* Legend with Actions */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            minWidth: '280px',
                        }}>
                            {chartData.map((item, index) => {
                                const position = portfolio?.items[index];
                                const isDeleting = deletingId === position?.portfolio_id;

                                return (
                                    <div
                                        key={item.name}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            background: 'var(--surface)',
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '16px',
                                                height: '16px',
                                                borderRadius: '4px',
                                                background: item.color,
                                                flexShrink: 0,
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
                                            color: item.color,
                                            marginRight: '8px',
                                        }}>
                                            {item.allocation.toFixed(1)}%
                                        </div>
                                        {/* Delete button */}
                                        <button
                                            onClick={() => position && handleDeletePosition(position)}
                                            disabled={isDeleting}
                                            style={{
                                                padding: '6px',
                                                borderRadius: '8px',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--text-secondary)',
                                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                                opacity: isDeleting ? 0.5 : 1,
                                                transition: 'all 0.2s',
                                            }}
                                            onMouseEnter={(e) => !isDeleting && (e.currentTarget.style.color = '#EF4444')}
                                            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
                                        >
                                            {isDeleting ? (
                                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
