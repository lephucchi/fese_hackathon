/**
 * Content Card Component
 * Responsibility: Display educational content item
 */
'use client';

import { AcademyContent } from '@/types/dashboard.types';

interface ContentCardProps {
  readonly content: AcademyContent;
  readonly onClick?: (content: AcademyContent) => void;
}

/**
 * Gets content type emoji
 */
function getContentTypeEmoji(type: AcademyContent['contentType']): string {
  const emojiMap = {
    article: '📖',
    video: '🎥',
    course: '🎬',
  };
  return emojiMap[type];
}

/**
 * Formats duration to display string
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} phút`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 
    ? `${hours}h ${remainingMinutes}m`
    : `${hours} giờ`;
}

export function ContentCard({ content, onClick }: ContentCardProps) {
  const handleClick = () => {
    onClick?.(content);
  };

  return (
    <div 
      className="content-card"
      onClick={handleClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {content.isPremium && (
        <div className="lock-badge">
          🔒 {content.pointsCost} điểm
        </div>
      )}

      <div className="content-thumbnail">
        {content.thumbnailUrl ? (
          <img src={content.thumbnailUrl} alt={content.title} />
        ) : (
          <span>{getContentTypeEmoji(content.contentType)}</span>
        )}
      </div>

      <div className="content-info">
        <h4>{content.title}</h4>
        <p className="content-description">{content.description}</p>

        <div className="content-meta">
          <span>⏱️ {formatDuration(content.duration)}</span>
          <span className={content.isPremium ? 'premium-badge' : 'free-badge'}>
            {content.isPremium ? 'Premium' : 'Miễn phí'}
          </span>
        </div>
      </div>
    </div>
  );
}
