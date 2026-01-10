/**
 * Portfolio Stats Component
 * Responsibility: Display portfolio statistics
 */
'use client';

import { Portfolio } from '@/types/dashboard.types';

interface PortfolioStatsProps {
    readonly portfolio: Portfolio;
}

/**
 * Formats number to Vietnamese currency
 */
function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
    }).format(amount);
}

/**
 * Formats percentage with sign
 */
function formatPercentage(value: number): string {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
}

/**
 * Gets class name for profit/loss value
 */
function getProfitLossClassName(value: number): string {
    if (value > 0) return 'stat-value positive';
    if (value < 0) return 'stat-value negative';
    return 'stat-value';
}

export function PortfolioStats({ portfolio }: PortfolioStatsProps) {
    const stats = [
        {
            label: 'Tổng tài sản',
            value: formatCurrency(portfolio.totalValue),
            className: 'stat-value',
        },
        {
            label: 'Lãi/Lỗ hôm nay',
            value: `${formatCurrency(portfolio.todayProfitLoss)} (${formatPercentage(portfolio.todayProfitLossPercent)})`,
            className: getProfitLossClassName(portfolio.todayProfitLoss),
        },
        {
            label: 'Tổng lãi/lỗ',
            value: `${formatCurrency(portfolio.totalProfitLoss)} (${formatPercentage(portfolio.totalProfitLossPercent)})`,
            className: getProfitLossClassName(portfolio.totalProfitLoss),
        },
        {
            label: 'Số mã cổ phiếu',
            value: `${portfolio.positions.length} mã`,
            className: 'stat-value',
        },
    ];

    return (
        <div className="portfolio-stats">
            <h2>Tổng quan</h2>
            {stats.map((stat) => (
                <div key={stat.label} className="stat-item">
                    <span className="stat-label">{stat.label}</span>
                    <span className={stat.className}>{stat.value}</span>
                </div>
            ))}
        </div>
    );
}
