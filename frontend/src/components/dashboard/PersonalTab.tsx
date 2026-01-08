/**
 * Personal Tab Component - Portfolio & Macro Alignment
 * Responsibility: Display portfolio with macro news impact analysis
 */
'use client';

import { Portfolio, SynthesisReport } from '@/types/dashboard.types';
import { PortfolioChart } from './PortfolioChart';
import { PortfolioStats } from './PortfolioStats';
import { SynthesisReportComponent } from './SynthesisReport';

interface PersonalTabProps {
  readonly portfolio: Portfolio;
  readonly report: SynthesisReport;
  readonly onEditPortfolio: () => void;
}

export function PersonalTab({ portfolio, report, onEditPortfolio }: PersonalTabProps) {
  return (
    <div className="personal-tab-wrapper">
      {/* Header with macro impact summary */}
      <div className="portfolio-header">
        <div className="portfolio-title">
          <h1>💼 Danh mục của bạn</h1>
          <p className="portfolio-subtitle">Tác động của tin tức vĩ mô và phân tích thị trường</p>
        </div>
        <button className="edit-portfolio-btn" onClick={onEditPortfolio}>
          ✏️ Chỉnh sửa
        </button>
      </div>

      {/* Macro impact alert */}
      <div className="macro-impact-card">
        <div className="impact-icon">⚠️</div>
        <div className="impact-content">
          <h3>Tác động vĩ mô hôm nay</h3>
          <p>Có 3 sự kiện kinh tế sẽ ảnh hưởng đến danh mục của bạn. Xem chi tiết trong tab Phân tích Vĩ mô.</p>
        </div>
      </div>

      {/* Portfolio overview - Charts and stats */}
      <div className="portfolio-overview">
        <PortfolioChart 
          portfolio={portfolio}
          onEditClick={onEditPortfolio}
        />
        <PortfolioStats portfolio={portfolio} />
      </div>

      {/* AI Synthesis Report - Daily analysis */}
      <SynthesisReportComponent report={report} />
    </div>
  );
}
