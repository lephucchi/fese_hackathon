/**
 * Personal Portfolio Page Layout - SEO Metadata
 */
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Danh mục Cá nhân',
  description: 'Quản lý danh mục đầu tư cá nhân của bạn. Theo dõi hiệu suất, phân tích lợi nhuận và nhận insights từ AI về các cổ phiếu trong danh mục.',
  keywords: [
    'danh mục đầu tư',
    'quản lý portfolio',
    'theo dõi cổ phiếu',
    'phân tích danh mục',
    'hiệu suất đầu tư',
    'portfolio tracker'
  ],
  openGraph: {
    title: 'Danh mục Cá nhân | MacroInsight',
    description: 'Quản lý và theo dõi danh mục đầu tư cá nhân với AI insights',
    type: 'website',
    images: ['/og-personal.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Danh mục Cá nhân | MacroInsight',
    description: 'Quản lý và theo dõi danh mục đầu tư cá nhân với AI insights',
  },
  alternates: {
    canonical: '/personal',
  },
};

const breadcrumbItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Danh mục', href: '/personal' },
];

export default function PersonalLayout({
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
