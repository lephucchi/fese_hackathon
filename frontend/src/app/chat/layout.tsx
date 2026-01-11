/**
 * Chat Page Layout - SEO Metadata
 */
import type { Metadata } from 'next';
import { Breadcrumbs } from '@/components/seo';

export const metadata: Metadata = {
  title: 'AI Chat - Trợ lý Tài chính Thông minh',
  description: 'Trò chuyện với AI chatbot thông minh về thị trường chứng khoán Việt Nam, kinh tế vĩ mô, pháp lý tài chính. Hỏi đáp tức thì với RAG technology.',
  keywords: [
    'AI chatbot tài chính',
    'trợ lý AI',
    'hỏi đáp chứng khoán',
    'RAG',
    'phân tích thị trường AI',
    'chatbot Việt Nam',
    'tư vấn tài chính AI'
  ],
  openGraph: {
    title: 'AI Chat - Trợ lý Tài chính Thông minh | MacroInsight',
    description: 'Trò chuyện với AI chatbot thông minh về thị trường chứng khoán Việt Nam',
    type: 'website',
    images: ['/og-chat.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Chat - Trợ lý Tài chính Thông minh | MacroInsight',
    description: 'Trò chuyện với AI chatbot thông minh về thị trường chứng khoán Việt Nam',
  },
  alternates: {
    canonical: '/chat',
  },
};

const breadcrumbItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'AI Chat', href: '/chat' },
];

export default function ChatLayout({
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
