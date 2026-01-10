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
}

// Mock data based on specification
const mockVideos: VideoContent[] = [
  // Recommended for You (Free)
  {
    id: 1,
    titleKey: 'education.videos.steelCycle',
    title: 'Chu kỳ ngành Thép',
    isLocked: false,
    points: 0,
    category: 'Basic',
    duration: '12 mins',
    thumbnail: '📊'
  },
  {
    id: 2,
    titleKey: 'education.videos.gdpImpact',
    title: 'Hiểu về GDP và tác động thị trường',
    isLocked: false,
    points: 0,
    category: 'Basic',
    duration: '15 mins',
    thumbnail: '📈'
  },
  {
    id: 3,
    titleKey: 'education.videos.inflationInterest',
    title: 'Lạm phát và Lãi suất: Mối quan hệ',
    isLocked: false,
    points: 0,
    category: 'Basic',
    duration: '10 mins',
    thumbnail: '💰'
  },

  // Premium Masterclass (Locked)
  {
    id: 4,
    titleKey: 'education.videos.readingWhales',
    title: 'Đọc vị Cá mập (Advanced)',
    isLocked: true,
    points: 500,
    category: 'Premium',
    duration: '25 mins',
    thumbnail: '🦈'
  },
  {
    id: 5,
    titleKey: 'education.videos.cashFlowTechniques',
    title: 'Kỹ thuật nhìn dòng tiền',
    isLocked: true,
    points: 500,
    category: 'Premium',
    duration: '30 mins',
    thumbnail: '💸'
  },
  {
    id: 6,
    titleKey: 'education.videos.f0Analysis',
    title: 'Phân tích F0 chuyên sâu',
    isLocked: true,
    points: 300,
    category: 'Premium',
    duration: '20 mins',
    thumbnail: '🎯'
  },
  {
    id: 7,
    titleKey: 'education.videos.advancedTrading',
    title: 'Chiến lược Trading nâng cao',
    isLocked: true,
    points: 700,
    category: 'Premium',
    duration: '35 mins',
    thumbnail: '⚡'
  },
  {
    id: 8,
    titleKey: 'education.videos.readingFinancials',
    title: 'Đọc báo cáo tài chính như Pro',
    isLocked: true,
    points: 400,
    category: 'Premium',
    duration: '28 mins',
    thumbnail: '📑'
  },
  {
    id: 9,
    titleKey: 'education.videos.investorPsychology',
    title: 'Tâm lý học nhà đầu tư',
    isLocked: true,
    points: 600,
    category: 'Premium',
    duration: '22 mins',
    thumbnail: '🧠'
  },
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
