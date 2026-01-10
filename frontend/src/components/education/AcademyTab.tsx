/**
 * Academy Tab Component - Gamified Learning Hub
 * Responsibility: Display educational content with M-Points unlock system
 */
'use client';

import { useState } from 'react';
import { Lock, Play, Coins, TrendingUp, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export interface VideoContent {
  id: number;
  titleKey?: string; // Key for i18n translation
  title: string;
  isLocked: boolean;
  points: number;
  category: 'Basic' | 'Premium';
  duration: string;
  thumbnail?: string;
  youtubeUrl?: string; // YouTube embed URL
}

interface AcademyTabProps {
  readonly videos: readonly VideoContent[];
}

export function AcademyTab({ videos }: AcademyTabProps) {
  const { t } = useLanguage();
  const [mPoints, setMPoints] = useState(658);
  const [unlockedVideos, setUnlockedVideos] = useState<Set<number>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isStatsExpanded, setIsStatsExpanded] = useState(false);
  const [playingVideo, setPlayingVideo] = useState<VideoContent | null>(null);

  // Helper to get translated video title
  const getVideoTitle = (video: VideoContent): string => {
    if (video.titleKey) {
      const translated = t(video.titleKey);
      return typeof translated === 'string' ? translated : video.title;
    }
    return video.title;
  };

  // Helper to extract YouTube video ID from URL
  const getYouTubeVideoId = (url?: string): string | null => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([^?&]+)/);
    return match ? match[1] : null;
  };

  // Helper to get YouTube thumbnail URL
  const getYouTubeThumbnail = (url?: string): string | null => {
    const videoId = getYouTubeVideoId(url);
    return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
  };

  const currentLevel = 2;
  const currentPoints = 598;
  const pointsForNextLevel = 614;
  const progressPercent = Math.round((currentPoints / pointsForNextLevel) * 100 * 100) / 100;
  const pointsToNextLevel = pointsForNextLevel - currentPoints;

  const recommendedVideos = videos.filter(v => !v.isLocked);
  const premiumVideos = videos.filter(v => v.isLocked);

  const handleUnlock = () => {
    if (!selectedVideo || mPoints < selectedVideo.points) return;

    // Deduct points
    setMPoints(prev => prev - selectedVideo.points);
    
    // Unlock video
    setUnlockedVideos(prev => new Set([...prev, selectedVideo.id]));
    
    // Show confetti
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    
    // Close modal
    setSelectedVideo(null);
  };

  const isVideoUnlocked = (videoId: number) => unlockedVideos.has(videoId);

  return (
    <div style={{ 
      maxWidth: '1200px', 
      margin: '0 auto', 
      padding: '32px 24px',
      paddingBottom: '80px' 
    }}>
      {/* COMPACT GAMIFICATION HEADER */}
      <motion.div 
        style={{
          position: 'sticky',
          top: '80px',
          zIndex: 10,
          background: 'var(--card)',
          borderRadius: '16px',
          padding: isStatsExpanded ? '20px' : '12px 16px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)',
          border: '1.5px solid var(--primary)',
          cursor: 'pointer',
          transition: 'all 0.3s ease'
        }}
        animate={{
          padding: isStatsExpanded ? '20px' : '12px 16px',
        }}
        onClick={() => setIsStatsExpanded(!isStatsExpanded)}
      >
        {/* Compact View - Always visible */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: '16px'
        }}>
          {/* M-Points Display - Always visible */}
          <motion.div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
            key={mPoints}
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 0.3 }}
          >
            <Coins size={24} color="var(--primary)" strokeWidth={2.5} />
            <div>
              <div style={{ 
                fontSize: '0.75rem', 
                color: 'var(--text-secondary)', 
                fontWeight: 600,
                lineHeight: 1.2
              }}>
                {t('education.mPointsBalance')}
              </div>
              <div style={{ 
                fontSize: '1.25rem', 
                fontWeight: '800', 
                color: 'var(--primary)',
                lineHeight: 1.2
              }}>
                {mPoints.toLocaleString()}
              </div>
            </div>
          </motion.div>

          {/* Level Badge - Compact */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              background: 'var(--primary)',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '0.875rem',
              fontWeight: '700',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(34, 197, 94, 0.3)'
            }}>
              <TrendingUp size={16} />
              {t('education.level')} {currentLevel}
            </div>
            
            {/* Toggle Icon */}
            <motion.div
              animate={{ rotate: isStatsExpanded ? 180 : 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '1.25rem',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.25)',
                cursor: 'pointer',
                flexShrink: 0
              }}
            >
              {isStatsExpanded ? '▲' : '▼'}
            </motion.div>
          </div>
        </div>

        {/* Expanded View - Progress Details */}
        <AnimatePresence>
          {isStatsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0, marginTop: 0 }}
              animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
              exit={{ height: 0, opacity: 0, marginTop: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ 
                borderTop: '1px solid var(--border)',
                paddingTop: '16px'
              }}>
                {/* Progress Bar */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '8px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)'
                }}>
                  <span>{t('education.levelProgress')}</span>
                  <span>{currentPoints}/{pointsForNextLevel}</span>
                </div>
                <div style={{
                  height: '10px',
                  background: '#E5E7EB',
                  borderRadius: '9999px',
                  overflow: 'hidden',
                  position: 'relative'
                }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: 'linear-gradient(90deg, var(--primary) 0%, var(--primary-light) 100%)',
                      borderRadius: '9999px',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                      animation: 'shimmer 2s infinite'
                    }} />
                  </motion.div>
                </div>
                <div style={{ 
                  textAlign: 'right', 
                  marginTop: '4px', 
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--primary)'
                }}>
                  {progressPercent}%
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* SECTION 1: RECOMMENDED FOR YOU */}
      <div style={{ marginBottom: '48px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '800',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            🎯 {t('education.recommended')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {t('education.recommendedDesc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {recommendedVideos.map((video) => (
            <motion.div
              key={video.id}
              whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' }}
              style={{
                background: 'var(--card)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                cursor: 'pointer',
                border: '2px solid transparent',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
            >
              {/* Thumbnail */}
              <div style={{
                height: '180px',
                background: video.youtubeUrl 
                  ? `url(${getYouTubeThumbnail(video.youtubeUrl)}) center/cover`
                  : 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                position: 'relative'
              }}>
                {!video.youtubeUrl && video.thumbnail}
                <div style={{
                  position: 'absolute',
                  top: '12px',
                  right: '12px',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  fontWeight: '700'
                }}>
                  FREE
                </div>
                <div style={{
                  position: 'absolute',
                  bottom: '12px',
                  right: '12px',
                  background: 'rgba(0, 0, 0, 0.7)',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: '600'
                }}>
                  {video.duration}
                </div>
              </div>

              {/* Content */}
              <div style={{ padding: 'clamp(16px, 4vw, 20px)' }}>
                <h3 style={{
                  fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                  fontWeight: '700',
                  marginBottom: '12px',
                  lineHeight: '1.4',
                  minHeight: 'auto',
                  wordWrap: 'break-word',
                  overflowWrap: 'break-word',
                  hyphens: 'auto'
                }}>
                  {getVideoTitle(video)}
                </h3>
                <button 
                  onClick={() => setPlayingVideo(video)}
                  style={{
                  width: '100%',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: 'clamp(10px, 2.5vw, 12px)',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 200, 5, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <Play size={20} fill="white" />
                  {t('education.watchNow')}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* SECTION 2: PREMIUM MASTERCLASS */}
      <div style={{ position: 'relative' }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            fontSize: '1.875rem', 
            fontWeight: '800',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            👑 {t('education.premium')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>
            {t('education.premiumDesc')}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: '24px'
        }}>
          {premiumVideos.map((video) => {
            const unlocked = isVideoUnlocked(video.id);
            
            return (
              <motion.div
                key={video.id}
                whileHover={unlocked ? { y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)' } : {}}
                style={{
                  background: 'var(--card)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 6px rgba(0, 0, 0, 0.04)',
                  cursor: unlocked ? 'pointer' : 'default',
                  border: '2px solid transparent',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (unlocked) e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'transparent'}
              >
                {/* Thumbnail */}
                <div style={{
                  height: '180px',
                  background: video.youtubeUrl 
                    ? `url(${getYouTubeThumbnail(video.youtubeUrl)}) center/cover`
                    : unlocked 
                      ? 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                      : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  position: 'relative'
                }}>
                  {/* Locked overlay - only show for videos without YouTube URL */}
                  {!unlocked && !video.youtubeUrl && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(0, 0, 0, 0.5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: '8px'
                    }}>
                      <Lock size={48} color="white" />
                    </div>
                  )}
                  
                  {!video.youtubeUrl && video.thumbnail}
                  
                  {/* Lock badge for locked videos with YouTube */}
                  {!unlocked && video.youtubeUrl && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Lock size={14} />
                      {video.points} pts
                    </div>
                  )}
                  
                  {unlocked && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <CheckCircle size={14} />
                      {t('education.unlockSuccess').split('!')[0]}
                    </div>
                  )}
                  
                  <div style={{
                    position: 'absolute',
                    bottom: '12px',
                    right: '12px',
                    background: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: '600'
                  }}>
                    {video.duration}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: 'clamp(16px, 4vw, 20px)' }}>
                  <h3 style={{
                    fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
                    fontWeight: '700',
                    marginBottom: '12px',
                    lineHeight: '1.4',
                    minHeight: 'auto',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto'
                  }}>
                    {getVideoTitle(video)}
                  </h3>
                  
                  {unlocked ? (
                    <button 
                      onClick={() => setPlayingVideo(video)}
                      style={{
                      width: '100%',
                      background: 'var(--primary)',
                      color: 'white',
                      padding: 'clamp(10px, 2.5vw, 12px)',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0, 200, 5, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      <Play size={20} fill="white" />
                      {t('education.watchNow')}
                    </button>
                  ) : (
                    <button 
                      onClick={() => setSelectedVideo(video)}
                      disabled={mPoints < video.points}
                      style={{
                        width: '100%',
                        background: mPoints >= video.points 
                          ? 'var(--primary)'
                          : '#E5E7EB',
                        color: mPoints >= video.points ? 'white' : '#9CA3AF',
                        padding: 'clamp(10px, 2.5vw, 12px)',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: 'clamp(0.875rem, 2vw, 1rem)',
                        fontWeight: '700',
                        cursor: mPoints >= video.points ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (mPoints >= video.points) {
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <Lock size={18} />
                      {t('education.unlock')} {video.points} pts
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Coming Soon Overlay */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '16px',
          zIndex: 10,
          pointerEvents: 'all'
        }}>
          <div style={{
            background: 'var(--card)',
            padding: '32px 48px',
            borderRadius: '16px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            border: '2px solid var(--primary)'
          }}>
            <div style={{
              fontSize: '4rem',
              marginBottom: '16px'
            }}>
              🚀
            </div>
            <h3 style={{
              fontSize: '2rem',
              fontWeight: '800',
              color: 'var(--primary)',
              marginBottom: '8px'
            }}>
              {t('education.comingSoon')}
            </h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem'
            }}>
              {t('education.premium')} - {t('education.premiumDesc')}
            </p>
          </div>
        </div>
      </div>

      {/* UNLOCK CONFIRMATION MODAL */}
      <AnimatePresence>
        {selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '24px'
            }}
            onClick={() => setSelectedVideo(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--card)',
                borderRadius: '24px',
                padding: '48px',
                maxWidth: '500px',
                width: '100%',
                textAlign: 'center',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Treasure Chest Illustration */}
              <div style={{
                fontSize: '5rem',
                marginBottom: '24px'
              }}>
                🔑
              </div>

              <h2 style={{
                fontSize: '1.75rem',
                fontWeight: '800',
                marginBottom: '16px'
              }}>
                {t('education.unlock')}
              </h2>

              <p style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                marginBottom: '24px',
                color: '#333'
              }}>
                "{getVideoTitle(selectedVideo)}"
              </p>

              <div style={{
                background: 'rgba(0, 200, 5, 0.05)',
                padding: '24px',
                borderRadius: '16px',
                marginBottom: '32px',
                border: '2px solid var(--primary)'
              }}>
                <div style={{
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)',
                  marginBottom: '8px',
                  fontWeight: 600
                }}>
                  {t('education.unlockWith')}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '12px'
                }}>
                  <Coins size={32} color="var(--primary)" />
                  <span style={{
                    fontSize: '2.5rem',
                    fontWeight: '800',
                    color: 'var(--primary)'
                  }}>
                    {selectedVideo.points}
                  </span>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                  }}>
                    M-Points
                  </span>
                </div>
                <div style={{
                  marginTop: '12px',
                  fontSize: '0.875rem',
                  color: 'var(--text-secondary)'
                }}>
                  {t('education.balanceAfter')}: <strong style={{ color: mPoints - selectedVideo.points < 100 ? 'var(--error)' : 'var(--primary)' }}>
                    {(mPoints - selectedVideo.points).toLocaleString()} pts
                  </strong>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '16px'
              }}>
                <button
                  onClick={() => setSelectedVideo(null)}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    border: '2px solid #E5E7EB',
                    background: 'var(--card)',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--background-soft)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--card)';
                  }}
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleUnlock}
                  style={{
                    flex: 1,
                    padding: '16px',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'var(--primary)',
                    fontSize: '1rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    color: 'white',
                    transition: 'all 0.2s',
                    boxShadow: 'var(--shadow-glow-green)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 200, 5, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = 'var(--shadow-glow-green)';
                  }}
                >
                  {t('common.confirm')} & {t('education.unlock')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* YOUTUBE VIDEO MODAL */}
      <AnimatePresence>
        {playingVideo && playingVideo.youtubeUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPlayingVideo(null)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.85)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              cursor: 'pointer'
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--card)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '900px',
                width: '100%',
                cursor: 'default',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '700',
                  color: 'var(--text-primary)',
                  margin: 0
                }}>
                  {getVideoTitle(playingVideo)}
                </h3>
                <button
                  onClick={() => setPlayingVideo(null)}
                  style={{
                    background: 'var(--surface)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '36px',
                    height: '36px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'var(--text-secondary)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--primary)';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--surface)';
                    e.currentTarget.style.color = 'var(--text-secondary)';
                  }}
                >
                  ×
                </button>
              </div>

              {/* YouTube iframe */}
              <div style={{
                position: 'relative',
                paddingBottom: '56.25%', // 16:9 aspect ratio
                height: 0,
                overflow: 'hidden',
                borderRadius: '12px'
              }}>
                <iframe
                  src={playingVideo.youtubeUrl}
                  title={getVideoTitle(playingVideo)}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%'
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONFETTI ANIMATION */}
      <AnimatePresence>
        {showConfetti && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            zIndex: 99999,
            overflow: 'hidden'
          }}>
            {[...Array(50)].map((_, i) => (
              <motion.div
                key={i}
                initial={{
                  x: Math.random() * window.innerWidth,
                  y: -50,
                  rotate: 0,
                  opacity: 1
                }}
                animate={{
                  y: window.innerHeight + 50,
                  rotate: Math.random() * 720,
                  opacity: 0
                }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  ease: 'linear'
                }}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  background: ['#00C805', '#33D433', '#10B981', '#059669', '#00A004'][i % 5],
                  borderRadius: '50%'
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
