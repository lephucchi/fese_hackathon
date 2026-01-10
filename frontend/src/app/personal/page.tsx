'use client';

import { Navigation } from '@/components/shared/Navigation';
import { PersonalTab } from '@/components/dashboard/PersonalTab';
import { SynthesisReport } from '@/types/dashboard.types';

// Mock report data (portfolio now fetched via API)
const mockReport: SynthesisReport = {
  date: new Date(),
  overview: 'Thị trường tích cực với dòng tiền mạnh vào cổ phiếu ngân hàng và thép.',
  positiveFactors: [
    'Lãi suất giảm hỗ trợ ngành ngân hàng tăng trưởng tín dụng',
    'Giá thép tăng nhẹ do nhu cầu xây dựng phục hồi',
  ],
  negativeFactors: [
    'Tỷ giá USD/VND tăng cao gây áp lực lên các doanh nghiệp nhập khẩu',
  ],
  aiRecommendations: ['Giữ danh mục hiện tại. Theo dõi diễn biến lãi suất tuần tới.'],
};

export default function PersonalPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ paddingTop: '80px' }}>
        <PersonalTab report={mockReport} />
      </main>
    </div>
  );
}
