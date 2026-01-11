/**
 * Education Page Layout - SEO Metadata
 */
import type { Metadata } from 'next';
import { Breadcrumbs, FAQSchema } from '@/components/seo';

export const metadata: Metadata = {
  title: 'Học viện Tài chính',
  description: 'Nâng cao kiến thức tài chính với các khóa học, bài viết và video chuyên sâu. Học về chứng khoán, kinh tế vĩ mô, phân tích kỹ thuật và đầu tư thông minh.',
  keywords: [
    'học tài chính',
    'khóa học chứng khoán',
    'kiến thức đầu tư',
    'phân tích kỹ thuật',
    'kinh tế vĩ mô',
    'học viện tài chính',
    'đào tạo tài chính',
    'tài liệu học tập'
  ],
  openGraph: {
    title: 'Học viện Tài chính | MacroInsight',
    description: 'Nâng cao kiến thức tài chính với các khóa học và bài viết chuyên sâu',
    type: 'website',
    images: ['/og-education.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Học viện Tài chính | MacroInsight',
    description: 'Nâng cao kiến thức tài chính với các khóa học và bài viết chuyên sâu',
  },
  alternates: {
    canonical: '/education',
  },
};

const breadcrumbItems = [
  { name: 'Trang chủ', href: '/' },
  { name: 'Học viện', href: '/education' },
];

const faqItems = [
  {
    question: 'Làm thế nào để bắt đầu học về chứng khoán?',
    answer: 'Bạn có thể bắt đầu với các khóa học cơ bản về thị trường chứng khoán, tìm hiểu về các loại chứng khoán, cách đọc biểu đồ và phân tích cơ bản. MacroInsight cung cấp các bài viết và video hướng dẫn chi tiết cho người mới bắt đầu.'
  },
  {
    question: 'Tôi cần bao nhiêu vốn để bắt đầu đầu tư?',
    answer: 'Bạn có thể bắt đầu đầu tư chứng khoán với số vốn nhỏ, thậm chí từ vài triệu đồng. Quan trọng là bạn cần có kiến thức và chiến lược đầu tư phù hợp trước khi bắt đầu.'
  },
  {
    question: 'Phân tích kỹ thuật và phân tích cơ bản khác nhau như thế nào?',
    answer: 'Phân tích kỹ thuật tập trung vào biểu đồ giá và khối lượng giao dịch để dự đoán xu hướng. Phân tích cơ bản xem xét giá trị nội tại của doanh nghiệp thông qua báo cáo tài chính và yếu tố kinh tế vĩ mô.'
  }
];

export default function EducationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <FAQSchema faqs={faqItems} />
      {children}
    </>
  );
}
