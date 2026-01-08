'use client';

import { useState } from 'react';
import { Navigation } from '@/components/shared/Navigation';
import { PersonalTab } from '@/components/dashboard/PersonalTab';
import { Portfolio, SynthesisReport } from '@/types/dashboard.types';

// Mock data
const mockPortfolio: Portfolio = {
  totalValue: 1250000000,
  dailyChange: 2.34,
  holdings: [
    { ticker: 'HPG', name: 'Hòa Phát', value: 450000000, allocation: 36, dailyChange: 1.2 },
    { ticker: 'VCB', name: 'Vietcombank', value: 350000000, allocation: 28, dailyChange: -0.5 },
    { ticker: 'VHM', name: 'Vinhomes', value: 250000000, allocation: 20, dailyChange: 3.1 },
    { ticker: 'VNM', name: 'Vinamilk', value: 200000000, allocation: 16, dailyChange: 0.8 },
  ],
  cash: 125000000,
};

const mockReport: SynthesisReport = {
  date: new Date().toISOString(),
  summary: 'Thị trường tích cực với dòng tiền mạnh vào cổ phiếu ngân hàng và thép.',
  positives: [
    'Lãi suất giảm hỗ trợ ngành ngân hàng tăng trưởng tín dụng',
    'Giá thép tăng nhẹ do nhu cầu xây dựng phục hồi',
  ],
  negatives: [
    'Tỷ giá USD/VND tăng cao gây áp lực lên các doanh nghiệp nhập khẩu',
  ],
  recommendation: 'Giữ danh mục hiện tại. Theo dõi diễn biến lãi suất tuần tới.',
};

export default function PersonalPage() {
  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ paddingTop: '80px' }}>
        <PersonalTab 
          portfolio={mockPortfolio}
          report={mockReport}
          onEditPortfolio={() => setShowEditModal(true)}
        />
      </main>
    </div>
  );
}
