/**
 * PortfolioCard - Redesigned portfolio display with modern donut chart
 * Features: Inline add ticker, premium donut chart, rich legend, smooth animations
 */
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Loader2, TrendingUp, AlertCircle, LogIn, Briefcase, PieChart as PieChartIcon, X, Check } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useAuth } from '@/hooks/useAuth';
import { CreatePositionData, PortfolioItem } from '@/services/api/portfolio.service';
import { useLanguage } from '@/contexts/LanguageContext';

// Premium gradient colors for chart
const CHART_COLORS = [
    { main: '#00C805', gradient: 'linear-gradient(135deg, #00C805 0%, #4ADE80 100%)' },
    { main: '#3B82F6', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)' },
    { main: '#F59E0B', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)' },
    { main: '#8B5CF6', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)' },
    { main: '#EF4444', gradient: 'linear-gradient(135deg, #EF4444 0%, #F87171 100%)' },
    { main: '#EC4899', gradient: 'linear-gradient(135deg, #EC4899 0%, #F472B6 100%)' },
    { main: '#06B6D4', gradient: 'linear-gradient(135deg, #06B6D4 0%, #22D3EE 100%)' },
    { main: '#F97316', gradient: 'linear-gradient(135deg, #F97316 0%, #FB923C 100%)' },
    { main: '#6366F1', gradient: 'linear-gradient(135deg, #6366F1 0%, #818CF8 100%)' },
    { main: '#14B8A6', gradient: 'linear-gradient(135deg, #14B8A6 0%, #2DD4BF 100%)' },
];

// Format currency helper
const formatVND = (amount: number): string => {
    if (amount >= 1000000000) {
        return `${(amount / 1000000000).toFixed(2)}B`;
    } else if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    return new Intl.NumberFormat('vi-VN').format(amount);
};

const formatFullVND = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN').format(amount);
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { allocation: number } }> }) => {
    if (active && payload && payload.length) {
        const data = payload[0];
        return (
            <div style={{
                background: 'var(--card)',
                padding: '12px 16px',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
                border: '1px solid var(--border)',
            }}>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {data.name}
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    {formatFullVND(data.value)} ₫ ({data.payload.allocation.toFixed(1)}%)
                </div>
            </div>
        );
    }
    return null;
};

export function PortfolioCard() {
    const { t } = useLanguage();
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const { portfolio, isLoading, error, addNewPosition, removePosition } = usePortfolio();

    // Inline add form state
    const [showAddForm, setShowAddForm] = useState(false);
    const [ticker, setTicker] = useState('');
    const [quantity, setQuantity] = useState('');
    const [avgPrice, setAvgPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [formError, setFormError] = useState('');
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const handleAddPosition = async () => {
        setFormError('');

        if (!ticker.trim()) {
            setFormError(t('personal.portfolio.form.tickerRequired') as string);
            return;
        }
        if (!quantity || parseInt(quantity) <= 0) {
            setFormError(t('personal.portfolio.form.quantityRequired') as string);
            return;
        }
        if (!avgPrice || parseFloat(avgPrice) <= 0) {
            setFormError(t('personal.portfolio.form.priceRequired') as string);
            return;
        }

        setIsSubmitting(true);
        try {
            await addNewPosition({
                ticker: ticker.toUpperCase().trim(),
                volume: parseInt(quantity),
                avg_buy_price: parseFloat(avgPrice),
            });
            // Reset form
            setTicker('');
            setQuantity('');
            setAvgPrice('');
            setShowAddForm(false);
        } catch (err) {
            setFormError(err instanceof Error ? err.message : 'Đã có lỗi xảy ra');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeletePosition = async (item: PortfolioItem) => {
        if (!confirm(`${t('personal.portfolio.confirmDelete')} ${item.ticker}?`)) return;

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
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background decoration */}
                <div style={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: '200px',
                    height: '200px',
                    background: 'radial-gradient(circle, rgba(0, 200, 5, 0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #4ADE80 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Briefcase size={24} style={{ color: 'white' }} />
                    </div>
                    <h2 style={{
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: 0,
                    }}>
                        {t('personal.portfolio.allocation')}
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
                        {t('personal.portfolio.loginRequired')}
                    </h3>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '0',
                    }}>
                        {t('personal.portfolio.loginDesc')}
                    </p>
                </div>
            </motion.div>
        );
    }

    // Loading state
    if (authLoading || isLoading) {
        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                    background: 'var(--card)',
                    borderRadius: '24px',
                    padding: '64px',
                    boxShadow: 'var(--shadow-fintech)',
                    marginBottom: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '16px',
                }}
            >
                <div style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--primary) 0%, #4ADE80 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <Loader2 size={32} style={{ color: 'white', animation: 'spin 1s linear infinite' }} />
                </div>
                <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>
                    {t('personal.portfolio.loading')}
                </span>
            </motion.div>
        );
    }

    // Prepare chart data
    const chartData = portfolio?.items.map((item, index) => ({
        name: item.ticker,
        value: item.market_value,
        allocation: item.allocation_percent,
        color: CHART_COLORS[index % CHART_COLORS.length].main,
        volume: item.volume,
        avgPrice: item.avg_buy_price,
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
                padding: 'clamp(20px, 4vw, 32px)',
                boxShadow: 'var(--shadow-fintech)',
                marginBottom: '32px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Background decoration */}
            <div style={{
                position: 'absolute',
                top: -100,
                right: -100,
                width: '300px',
                height: '300px',
                background: 'radial-gradient(circle, rgba(0, 200, 5, 0.06) 0%, transparent 70%)',
                pointerEvents: 'none',
            }} />

            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #4ADE80 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(0, 200, 5, 0.3)',
                    }}>
                        <Briefcase size={24} style={{ color: 'white' }} />
                    </div>
                    <div>
                        <h2 style={{
                            fontSize: 'clamp(1.125rem, 3vw, 1.5rem)',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                        }}>
                            {t('personal.portfolio.allocation')}
                        </h2>
                        {hasPortfolio && (
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--text-secondary)',
                                margin: 0,
                            }}>
                                {portfolio?.position_count} {t('personal.portfolio.tickers')}
                            </p>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="interactive-scale"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 20px',
                        borderRadius: '9999px',
                        border: 'none',
                        background: showAddForm ? 'rgba(239, 68, 68, 0.1)' : 'var(--primary)',
                        color: showAddForm ? '#EF4444' : 'white',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: showAddForm ? 'none' : '0 4px 12px rgba(0, 200, 5, 0.3)',
                    }}
                >
                    {showAddForm ? <X size={18} /> : <Plus size={18} />}
                    {showAddForm ? t('personal.portfolio.cancel') : t('personal.portfolio.addTicker')}
                </button>
            </div>

            {/* Error display */}
            {(error || formError) && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
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
                    }}
                >
                    <AlertCircle size={18} />
                    {error || formError}
                </motion.div>
            )}

            {/* Inline Add Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{
                            marginBottom: '24px',
                            overflow: 'hidden',
                        }}
                    >
                        <div style={{
                            background: 'var(--surface)',
                            borderRadius: '16px',
                            padding: '20px',
                            border: '1px solid var(--border)',
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                                gap: '12px',
                                marginBottom: '16px',
                            }}>
                                {/* Ticker Input */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {t('personal.portfolio.form.ticker')}
                                    </label>
                                    <input
                                        type="text"
                                        value={ticker}
                                        onChange={(e) => setTicker(e.target.value.toUpperCase())}
                                        placeholder="VCB, FPT..."
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--border)',
                                            background: 'var(--card)',
                                            fontSize: '0.9375rem',
                                            fontWeight: 600,
                                            color: 'var(--text-primary)',
                                            textTransform: 'uppercase',
                                        }}
                                    />
                                </div>

                                {/* Quantity Input */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {t('personal.portfolio.form.quantity')}
                                    </label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        placeholder="100"
                                        min="1"
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--border)',
                                            background: 'var(--card)',
                                            fontSize: '0.9375rem',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                </div>

                                {/* Price Input */}
                                <div>
                                    <label style={{
                                        display: 'block',
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {t('personal.portfolio.form.avgPrice')}
                                    </label>
                                    <input
                                        type="number"
                                        value={avgPrice}
                                        onChange={(e) => setAvgPrice(e.target.value)}
                                        placeholder="50000"
                                        min="1"
                                        style={{
                                            width: '100%',
                                            padding: '12px 14px',
                                            borderRadius: '10px',
                                            border: '1.5px solid var(--border)',
                                            background: 'var(--card)',
                                            fontSize: '0.9375rem',
                                            color: 'var(--text-primary)',
                                        }}
                                    />
                                </div>

                                {/* Submit Button */}
                                <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                                    <button
                                        onClick={handleAddPosition}
                                        disabled={isSubmitting}
                                        className="interactive-scale"
                                        style={{
                                            width: '100%',
                                            padding: '12px 20px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'var(--primary)',
                                            color: 'white',
                                            fontSize: '0.9375rem',
                                            fontWeight: 600,
                                            cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '8px',
                                            opacity: isSubmitting ? 0.6 : 1,
                                        }}
                                    >
                                        {isSubmitting ? (
                                            <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                                        ) : (
                                            <Check size={18} />
                                        )}
                                        {t('personal.portfolio.form.add')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
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
                        borderRadius: '20px',
                        background: 'var(--surface)',
                    }}
                >
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, rgba(0, 200, 5, 0.1) 0%, rgba(74, 222, 128, 0.1) 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}>
                        <PieChartIcon size={36} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h3 style={{
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        marginBottom: '8px',
                    }}>
                        {t('personal.portfolio.emptyTitle')}
                    </h3>
                    <p style={{
                        color: 'var(--text-secondary)',
                        marginBottom: '24px',
                        maxWidth: '300px',
                        margin: '0 auto 24px',
                    }}>
                        {t('personal.portfolio.emptyDesc')}
                    </p>
                    <button
                        onClick={() => setShowAddForm(true)}
                        className="interactive-scale"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '14px 28px',
                            borderRadius: '9999px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontSize: '15px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            boxShadow: '0 4px 16px rgba(0, 200, 5, 0.3)',
                        }}
                    >
                        <Plus size={18} />
                        {t('personal.portfolio.addFirstTicker')}
                    </button>
                </motion.div>
            )}

            {/* Portfolio Chart & Legend */}
            {hasPortfolio && (
                <>
                    {/* Total Value Card */}
                    <div style={{
                        background: 'linear-gradient(135deg, var(--primary) 0%, #00a004 100%)',
                        borderRadius: '20px',
                        padding: '24px',
                        marginBottom: '28px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}>
                        {/* Decorative circles */}
                        <div style={{
                            position: 'absolute',
                            top: -30,
                            right: -30,
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                        }} />
                        <div style={{
                            position: 'absolute',
                            bottom: -20,
                            right: 40,
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.05)',
                        }} />

                        <div style={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.8)',
                            marginBottom: '8px',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}>
                            {t('personal.portfolio.totalValue')}
                        </div>
                        <div style={{
                            fontSize: 'clamp(1.75rem, 5vw, 2.5rem)',
                            fontWeight: 800,
                            color: 'white',
                            lineHeight: 1,
                        }}>
                            {formatFullVND(totalValue)} <span style={{ fontSize: '0.6em', fontWeight: 600 }}>₫</span>
                        </div>
                    </div>

                    {/* Chart + Legend Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(200px, 300px) 1fr',
                        gap: 'clamp(20px, 4vw, 40px)',
                        alignItems: 'start',
                    }}>
                        {/* Donut Chart */}
                        <div style={{
                            position: 'relative',
                            height: '260px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        onMouseEnter={(_, index) => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                style={{
                                                    filter: hoveredIndex === index ? 'brightness(1.1)' : 'none',
                                                    transform: hoveredIndex === index ? 'scale(1.02)' : 'scale(1)',
                                                    transformOrigin: 'center',
                                                    transition: 'all 0.2s ease-out',
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Label */}
                            <div style={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                transform: 'translate(-50%, -50%)',
                                textAlign: 'center',
                                pointerEvents: 'none',
                            }}>
                                <div style={{
                                    fontSize: '2rem',
                                    fontWeight: 800,
                                    color: 'var(--text-primary)',
                                    lineHeight: 1,
                                }}>
                                    {portfolio?.position_count || 0}
                                </div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--text-secondary)',
                                    fontWeight: 500,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    {t('personal.portfolio.tickers')}
                                </div>
                            </div>
                        </div>

                        {/* Legend List */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '10px',
                            maxHeight: '300px',
                            overflowY: 'auto',
                        }}>
                            {chartData.map((item, index) => {
                                const position = portfolio?.items[index];
                                const isDeleting = deletingId === position?.portfolio_id;
                                const isHovered = hoveredIndex === index;

                                return (
                                    <motion.div
                                        key={item.name}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        onMouseEnter={() => setHoveredIndex(index)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '14px 16px',
                                            borderRadius: '14px',
                                            background: isHovered ? 'var(--surface)' : 'transparent',
                                            border: `1px solid ${isHovered ? item.color : 'transparent'}`,
                                            transition: 'all 0.2s',
                                        }}
                                    >
                                        {/* Color indicator */}
                                        <div style={{
                                            width: '12px',
                                            height: '36px',
                                            borderRadius: '6px',
                                            background: item.color,
                                            flexShrink: 0,
                                        }} />

                                        {/* Ticker info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                marginBottom: '2px',
                                            }}>
                                                <span style={{
                                                    fontSize: '1rem',
                                                    fontWeight: 700,
                                                    color: 'var(--text-primary)',
                                                }}>
                                                    {item.name}
                                                </span>
                                                <span style={{
                                                    fontSize: '0.75rem',
                                                    fontWeight: 600,
                                                    color: item.color,
                                                    background: `${item.color}15`,
                                                    padding: '2px 8px',
                                                    borderRadius: '9999px',
                                                }}>
                                                    {item.allocation.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div style={{
                                                fontSize: '0.8125rem',
                                                color: 'var(--text-secondary)',
                                            }}>
                                                {item.volume.toLocaleString()} × {formatVND(item.avgPrice)}
                                            </div>
                                        </div>

                                        {/* Value */}
                                        <div style={{
                                            textAlign: 'right',
                                            marginRight: '8px',
                                        }}>
                                            <div style={{
                                                fontSize: '0.9375rem',
                                                fontWeight: 600,
                                                color: 'var(--text-primary)',
                                            }}>
                                                {formatVND(item.value)} ₫
                                            </div>
                                        </div>

                                        {/* Delete button */}
                                        <button
                                            onClick={() => position && handleDeletePosition(position)}
                                            disabled={isDeleting}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '10px',
                                                border: 'none',
                                                background: isDeleting ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                                                color: '#EF4444',
                                                cursor: isDeleting ? 'not-allowed' : 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                opacity: isHovered ? 1 : 0.5,
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            {isDeleting ? (
                                                <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                            ) : (
                                                <Trash2 size={16} />
                                            )}
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
