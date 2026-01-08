'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Target, BarChart3, Sparkles, Award, BookOpen } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: 'Swipe để lọc tin',
    description: 'Vuốt trái để bỏ qua, vuốt phải để lưu. Chỉ mất 1 phút để hoàn tất bản tin sáng với 10 tin quan trọng nhất.',
    color: '#00C805'
  },
  {
    icon: Target,
    title: 'Phân tích cá nhân hóa',
    description: 'AI tự động phân tích tác động của tin tức đến chính danh mục đầu tư của bạn với nhãn màu trực quan.',
    color: '#FFD700'
  },
  {
    icon: BarChart3,
    title: 'Báo cáo tổng hợp',
    description: 'Nhận bản phân tích tổng quan hàng ngày về sức khỏe danh mục, rủi ro và cơ hội từ tin tức.',
    color: '#FF9F1C'
  },
  {
    icon: Sparkles,
    title: 'Chat thông minh',
    description: 'Hỏi đáp với AI về bất kỳ tin tức nào. Hệ thống tự động hiểu ngữ cảnh và đưa ra câu trả lời có căn cứ.',
    color: '#00C805'
  },
  {
    icon: Award,
    title: 'Tích điểm M-Point',
    description: 'Nhận điểm thưởng khi đọc tin và học kiến thức. Đổi điểm để mở khóa nội dung cao cấp.',
    color: '#FFD700'
  },
  {
    icon: BookOpen,
    title: 'Học viện tài chính',
    description: 'Nội dung học được đề xuất thông minh dựa trên sở thích của bạn. Học mà không thấy nhàm chán.',
    color: '#FF9F1C'
  }
];

export function FeatureHighlights() {
  return (
    <section
      id="features"
      style={{
        padding: '80px 0',
        background: 'var(--background-soft)',
        width: '100%'
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1.5rem' }}>
        {/* Section Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <div style={{ 
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(0, 200, 5, 0.1)',
            borderRadius: '9999px',
            marginBottom: '16px'
          }}>
            <span style={{ color: 'var(--primary)', fontSize: '14px', fontWeight: 600 }}>
              TÍNH NĂNG NỔI BẬT
            </span>
          </div>
          <h2 style={{ 
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            fontWeight: 800,
            marginBottom: '16px'
          }}>
            Trải nghiệm All-in-One
          </h2>
          <p style={{ 
            fontSize: '1.125rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            Một nền tảng duy nhất để lọc tin, phân tích tác động và học kiến thức đầu tư
          </p>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '32px'
        }}>
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="card interactive-lift"
              style={{ 
                padding: '32px'
              }}
            >
              <div style={{ 
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: `${feature.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px',
                color: feature.color
              }}>
                <feature.icon size={28} />
              </div>

              <h3
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  marginBottom: '1rem',
                  color: 'var(--text-primary)'
                }}
              >
                {feature.title}
              </h3>

              <p
                style={{
                  fontSize: '1rem',
                  lineHeight: 1.6,
                  color: 'var(--text-secondary)'
                }}
              >
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
