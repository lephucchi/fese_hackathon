/**
 * Academy Tab Component - Macro Economics Education
 * Responsibility: Display educational content focused on macro economics
 */
'use client';

import { AcademyContent } from '@/types/dashboard.types';
import { ContentCard } from './ContentCard';

interface AcademyTabProps {
  readonly personalizedContent: readonly AcademyContent[];
  readonly popularContent: readonly AcademyContent[];
  readonly onContentClick?: (content: AcademyContent) => void;
}

interface ContentSection {
  readonly title: string;
  readonly emoji: string;
  readonly description: string;
  readonly items: readonly AcademyContent[];
}

export function AcademyTab({ 
  personalizedContent, 
  popularContent,
  onContentClick 
}: AcademyTabProps) {
  const sections: readonly ContentSection[] = [
    {
      title: 'Dành riêng cho bạn',
      emoji: '🎯',
      description: 'Nội dung được cá nhân hóa dựa trên danh mục của bạn',
      items: personalizedContent,
    },
    {
      title: 'Cơ sở lý thuyết vĩ mô',
      emoji: '📚',
      description: 'Hiểu các chỉ số kinh tế chính ảnh hưởng đến thị trường',
      items: popularContent.filter((_, i) => i < Math.ceil(popularContent.length / 2)),
    },
    {
      title: 'Các sự kiện kinh tế quan trọng',
      emoji: '📊',
      description: 'Phân tích các sự kiện vĩ mô chính và tác động của chúng',
      items: popularContent.filter((_, i) => i >= Math.ceil(popularContent.length / 2)),
    },
  ];

  return (
    <div className="academy-tab-wrapper">
      {/* Header */}
      <div className="academy-header">
        <div className="academy-title">
          <h1>📚 Học viện Vĩ mô</h1>
          <p className="academy-subtitle">
            Trở thành chuyên gia trong phân tích kinh tế vĩ mô
          </p>
        </div>
        <div className="academy-progress">
          <div className="progress-label">Tiến độ học tập</div>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: '65%' }}></div>
          </div>
          <span className="progress-text">65%</span>
        </div>
      </div>

      {/* Featured learning path */}
      <div className="featured-path">
        <div className="featured-icon">✨</div>
        <div className="featured-content">
          <h3>Đường học tập: Từ Cơ bản đến Nâng cao</h3>
          <p>
            Học cách phân tích các chỉ số kinh tế vĩ mô, dự báo thị trường và 
            đưa ra quyết định đầu tư thông minh dựa trên dữ liệu kinh tế.
          </p>
          <button className="featured-btn">Bắt đầu</button>
        </div>
      </div>

      {/* Content sections */}
      {sections.map((section) => (
        <div key={section.title} className="academy-section macro-focused">
          <div className="section-header">
            <h2>
              <span className="section-emoji">{section.emoji}</span>
              {section.title}
            </h2>
            <p className="section-description">{section.description}</p>
          </div>

          {section.items.length > 0 ? (
            <div className="content-grid">
              {section.items.map((item) => (
                <ContentCard
                  key={item.id}
                  content={item}
                  onClick={onContentClick}
                />
              ))}
            </div>
          ) : (
            <p className="empty-section">Chưa có nội dung</p>
          )}
        </div>
      ))}

      {/* CTA section */}
      <div className="academy-cta">
        <h3>Sẵn sàng cập nhật kiến thức hàng tuần?</h3>
        <p>Đăng ký nhận bản tin hàng tuần về phân tích vĩ mô và các xu hướng thị trường</p>
        <button className="cta-btn">📧 Đăng ký bản tin</button>
      </div>
    </div>
  );
}
