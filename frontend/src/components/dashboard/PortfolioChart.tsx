/**
 * Portfolio Chart Component
 * Responsibility: Display portfolio visualization
 */
'use client';

import { Portfolio } from '@/types/dashboard.types';

interface PortfolioChartProps {
  readonly portfolio: Portfolio;
  readonly onEditClick: () => void;
}

export function PortfolioChart({ portfolio, onEditClick }: PortfolioChartProps) {
  return (
    <div className="portfolio-chart">
      <h2>Danh mục đầu tư</h2>
      
      <div className="chart-placeholder" aria-label="Portfolio chart placeholder">
        📊
      </div>
      
      <button 
        className="btn-primary full-width" 
        onClick={onEditClick}
      >
        Chỉnh sửa danh mục
      </button>
    </div>
  );
}
