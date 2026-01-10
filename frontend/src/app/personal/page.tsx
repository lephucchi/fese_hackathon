'use client';

import { Navigation } from '@/components/shared/Navigation';
import { PersonalTab } from '@/components/dashboard/PersonalTab';
import { SynthesisReport } from '@/types/dashboard.types';
import { useLanguage } from '@/contexts/LanguageContext';

// Mock reports for different languages
const mockReportVi: SynthesisReport = {
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

const mockReportEn: SynthesisReport = {
  date: new Date(),
  overview: 'Market is positive with strong cash flow into banking and steel stocks.',
  positiveFactors: [
    'Lower interest rates support banking sector credit growth',
    'Steel prices slightly increased due to construction demand recovery',
  ],
  negativeFactors: [
    'Rising USD/VND exchange rate puts pressure on importing businesses',
  ],
  aiRecommendations: ['Hold current portfolio. Monitor interest rate developments next week.'],
};

export default function PersonalPage() {
  const { language } = useLanguage();

  // Select report based on language
  const mockReport = language === 'en' ? mockReportEn : mockReportVi;

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ paddingTop: '80px' }}>
        <PersonalTab report={mockReport} />
      </main>
    </div>
  );
}
