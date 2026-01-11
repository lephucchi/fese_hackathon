/**
 * About Page Layout - SEO Metadata
 */
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Về chúng tôi',
  description: 'MacroInsight - Nền tảng tin tức và tri thức tài chính thông minh. Khám phá cách chúng tôi kết hợp AI, RAG technology và gamification để mang đến trải nghiệm tài chính độc đáo.',
  keywords: [
    'về MacroInsight',
    'nền tảng tài chính',
    'AI tài chính',
    'RAG technology',
    'fintech Việt Nam',
    'tin tức tài chính thông minh'
  ],
  openGraph: {
    title: 'Về chúng tôi | MacroInsight',
    description: 'Nền tảng tin tức và tri thức tài chính thông minh với AI và RAG technology',
    type: 'website',
    images: ['/og-about.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Về chúng tôi | MacroInsight',
    description: 'Nền tảng tin tức và tri thức tài chính thông minh với AI và RAG technology',
  },
  alternates: {
    canonical: '/about',
  },
};

const breadcrumbItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Về chúng tôi', href: '/about' },
];

export default function AboutLayout({
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
