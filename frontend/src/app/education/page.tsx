'use client';

import { Navigation } from '@/components/shared/Navigation';
import { AcademyTab } from '@/components/education/AcademyTab';

export interface VideoContent {
  id: number;
  titleKey: string; // Key for i18n translation
  title: string; // Fallback title
  isLocked: boolean;
  points: number;
  category: 'Basic' | 'Premium';
  duration: string;
  thumbnail?: string;
  youtubeUrl?: string; // YouTube embed URL
}

// Mock data based on specification
const mockVideos: VideoContent[] = [
  // Recommended for You (Free)
  {
    id: 1,
    titleKey: 'education.videos.economicsBasics',
    title: 'Tất cả khái niệm kinh tế cơ bản trong 19 phút (bằng hoạt hình)',
    isLocked: false,
    points: 0,
    category: 'Basic',
    duration: '19 mins',
    thumbnail: '📊',
    youtubeUrl: 'https://www.youtube.com/embed/kijxOKaXjsk?si=JBnJcmDIw2VyBPZE'
  },
  {
    id: 2,
    titleKey: 'education.videos.moneyMarket',
    title: 'Tất cả về thị trường tiền tệ trong 13 phút',
    isLocked: false,
    points: 0,
    category: 'Basic',
    duration: '13 mins',
    thumbnail: '📈',
    youtubeUrl: 'https://www.youtube.com/embed/zeAxHMloqyI?si=8Dn3m_pEWmPpVLNq'
  },
  {
    id: 3,
    titleKey: 'education.videos.dexrpExplained',
    title: 'Giải thích về sàn DeXRP trong 9 phút',
    isLocked: false,
    points: 0,
    category: 'Basic',
    duration: '9 mins',
    thumbnail: '💰',
    youtubeUrl: 'https://www.youtube.com/embed/vZygsjudk7Y?si=nhoChRkzPU3ipTcp'
  },

  // Premium Masterclass (Locked)
  {
    id: 4,
    titleKey: 'education.videos.stockInvestingBasics',
    title: 'Hướng Dẫn Đầu Tư Chứng Khoán Cơ Bản Từ A-Z (F0 phải biết)',
    isLocked: true,
    points: 500,
    category: 'Premium',
    duration: '56 mins',
    thumbnail: '📊',
    youtubeUrl: 'https://www.youtube.com/embed/8c1rSMYAbIU?si=vRpcxDh7z8kU7WWE'
  },
  {
    id: 5,
    titleKey: 'education.videos.realEstateAnalysis',
    title: 'Học Phân tích cổ phiếu ngành Bất động sản như một chuyên gia trong 10 ngày',
    isLocked: true,
    points: 500,
    category: 'Premium',
    duration: '45 mins',
    thumbnail: '🏢',
    youtubeUrl: 'https://www.youtube.com/embed/kwooO3qN4eY?si=QCkspn0oL8T8xB1z'
  },
  {
    id: 6,
    titleKey: 'education.videos.financialReports',
    title: 'Hướng Dẫn Đọc Hiểu Báo Cáo Tài Chính Cho Nhà Đầu Tư F0 (Cực Dễ Hiểu)',
    isLocked: true,
    points: 300,
    category: 'Premium',
    duration: '38 mins',
    thumbnail: '📄',
    youtubeUrl: 'https://www.youtube.com/embed/tPWVzRQHDZA?si=QMck1nmckCcnJjzo'
  }
];

export default function EducationPage() {
  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh' }}>
      <Navigation />
      <main style={{ paddingTop: '80px' }}>
        <AcademyTab videos={mockVideos} />
      </main>
    </div>
  );
}
