/**
 * News Page - All News Feed
 * Server component with metadata + client component
 */
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo';
import NewsPageClient from './NewsPageClient';

export const metadata: Metadata = {
  title: 'Tin tức Tài chính',
  description: 'Cập nhật tin tức tài chính mới nhất về thị trường chứng khoán Việt Nam, kinh tế vĩ mô và phân tích thị trường. Lọc theo sentiment: tích cực, tiêu cực, trung lập.',
  keywords: [
    'tin tức tài chính',
    'chứng khoán Việt Nam',
    'phân tích thị trường',
    'sentiment analysis',
    'VN30',
    'VNINDEX',
    'tin tức kinh tế',
    'phân tích cổ phiếu',
    'thị trường chứng khoán'
  ],
  openGraph: {
    title: 'Tin tức Tài chính | MacroInsight',
    description: 'Cập nhật tin tức tài chính mới nhất về thị trường chứng khoán Việt Nam',
    type: 'website',
    images: ['/og-news.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tin tức Tài chính | MacroInsight',
    description: 'Cập nhật tin tức tài chính mới nhất về thị trường chứng khoán Việt Nam',
  },
  alternates: {
    canonical: '/news',
  },
};

const breadcrumbItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Tin tức', href: '/news' },
];

export default function NewsPage() {
  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <NewsPageClient />
    </>
  );
}
