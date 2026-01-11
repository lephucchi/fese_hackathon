/**
 * Dashboard Page Layout - SEO Metadata
 */
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Dashboard - Khám phá Tin tức',
  description: 'Khám phá tin tức tài chính theo phong cách Tinder swipe. Lọc tin quan trọng, lưu tin yêu thích và kiếm điểm thưởng. Trải nghiệm độc đáo với MacroInsight.',
  keywords: [
    'dashboard tài chính',
    'swipe news',
    'tin tức tài chính',
    'lọc tin tức',
    'chứng khoán Việt Nam',
    'gamification',
    'MacroInsight dashboard'
  ],
  openGraph: {
    title: 'Dashboard - Khám phá Tin tức | MacroInsight',
    description: 'Khám phá tin tức tài chính theo phong cách Tinder swipe',
    type: 'website',
    images: ['/og-dashboard.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Dashboard - Khám phá Tin tức | MacroInsight',
    description: 'Khám phá tin tức tài chính theo phong cách Tinder swipe',
  },
  alternates: {
    canonical: '/dashboard',
  },
};

const breadcrumbItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Dashboard', href: '/dashboard' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      {children}
    </>
  );
}
