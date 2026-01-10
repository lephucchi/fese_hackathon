'use client';

import { Navigation } from '@/components/shared/Navigation';
import { PersonalTab } from '@/components/dashboard/PersonalTab';
<<<<<<< HEAD
import { SynthesisReport } from '@/types/dashboard.types';

// Mock report data (portfolio now fetched via API)
const mockReport: SynthesisReport = {
=======
import { Portfolio, SynthesisReport } from '@/types/dashboard.types';
import { useLanguage } from '@/contexts/LanguageContext';

// Mock data
const mockPortfolio: Portfolio = {
  id: 'portfolio-1',
  totalValue: 1250000000,
  todayProfitLoss: 29250000,
  todayProfitLossPercent: 2.34,
  totalProfitLoss: 125000000,
  totalProfitLossPercent: 10.0,
  positions: [
    { symbol: 'HPG', quantity: 10000, averagePrice: 40000, currentPrice: 45000, profitLoss: 50000000, profitLossPercent: 12.5 },
    { symbol: 'VCB', quantity: 5000, averagePrice: 65000, currentPrice: 70000, profitLoss: 25000000, profitLossPercent: 7.7 },
    { symbol: 'VHM', quantity: 8000, averagePrice: 28000, currentPrice: 31250, profitLoss: 26000000, profitLossPercent: 11.6 },
    { symbol: 'VNM', quantity: 3000, averagePrice: 65000, currentPrice: 66667, profitLoss: 5000000, profitLossPercent: 2.6 },
  ],
};

// Mock reports for different languages
const mockReportVi: SynthesisReport = {
>>>>>>> main
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
<<<<<<< HEAD
=======
  const { language } = useLanguage();
  const [showEditModal, setShowEditModal] = useState(false);

  // Select report based on language
  const mockReport = language === 'en' ? mockReportEn : mockReportVi;

>>>>>>> main
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ paddingTop: '80px' }}>
        <PersonalTab report={mockReport} />
      </main>
    </div>
  );
}
