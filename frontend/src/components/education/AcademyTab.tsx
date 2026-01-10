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
}

interface AcademyTabProps {
  readonly videos: readonly VideoContent[];
}

export function AcademyTab({ videos }: AcademyTabProps) {
  const { t } = useLanguage();
  const [mPoints, setMPoints] = useState(650);
  const [unlockedVideos, setUnlockedVideos] = useState<Set<number>>(new Set());
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Helper to get translated video title
  const getVideoTitle = (video: VideoContent): string => {
    if (video.titleKey) {
      const translated = t(video.titleKey);
      return typeof translated === 'string' ? translated : video.title;
    }
    return video.title;
  };

  const currentLevel = 2;
  const progressPercent = 65;
  const pointsToNextLevel = 350;

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
      {/* GAMIFICATION HEADER */}
      <div style={{
        position: 'sticky',
        top: '80px',
        zIndex: 10,
        background: 'var(--card)',
        borderRadius: '24px',
        padding: '32px',
        marginBottom: '40px',
        boxShadow: 'var(--shadow-fintech)',
        border: '2px solid var(--primary)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '24px'
        }}>
          {/* Level Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'var(--primary)',
              padding: '12px 24px',
              borderRadius: '9999px',
              fontSize: '1.125rem',
              fontWeight: '700',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow-green)'
            }}>
              <TrendingUp size={20} />
              {t('education.level')} {currentLevel}
            </div>
          </div>

          {/* M-Points Wallet */}
          <motion.div 
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--card)',
              padding: '12px 24px',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-fintech)'
            }}
            key={mPoints}
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 0.3 }}
          >
            <Coins size={32} color="var(--primary)" />
            <div>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{t('education.mPointsBalance')}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--primary)' }}>
                {mPoints.toLocaleString()}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
            color: 'var(--text-secondary)'
          }}>
            <span>{t('education.levelProgress')}</span>
            <span>{pointsToNextLevel} {t('education.pointsToNext')} 3</span>
          </div>
          <div style={{
            height: '12px',
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
            fontSize: '0.875rem',
            fontWeight: 700,
            color: 'var(--primary)'
          }}>
            {progressPercent}%
          </div>
        </div>
      </div>

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
              whileHover={{ y: -8 }}
              style={{
                background: 'var(--card)',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-fintech)',
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
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '4rem',
                position: 'relative'
              }}>
                {video.thumbnail}
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
              <div style={{ padding: '20px' }}>
                <h3 style={{
                  fontSize: '1.125rem',
                  fontWeight: '700',
                  marginBottom: '12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  minHeight: '3.375rem'
                }}>
                  {getVideoTitle(video)}
                </h3>
                <button style={{
                  width: '100%',
                  background: 'var(--primary)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '12px',
                  border: 'none',
                  fontSize: '1rem',
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
      <div>
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
                whileHover={unlocked ? { y: -8 } : {}}
                style={{
                  background: 'var(--card)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-fintech)',
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
                  background: unlocked 
                    ? 'linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%)'
                    : 'linear-gradient(135deg, #6B7280 0%, #4B5563 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  position: 'relative'
                }}>
                  {/* Locked overlay */}
                  {!unlocked && (
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
                  
                  {video.thumbnail}
                  
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
                    }}>n                      <CheckCircle size={14} />
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
                <div style={{ padding: '20px' }}>
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '700',
                    marginBottom: '12px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    minHeight: '3.375rem'
                  }}>
                    {getVideoTitle(video)}
                  </h3>
                  
                  {unlocked ? (
                    <button style={{
                      width: '100%',
                      background: 'var(--primary)',
                      color: 'white',
                      padding: '12px',
                      borderRadius: '12px',
                      border: 'none',
                      fontSize: '1rem',
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
                        padding: '12px',
                        borderRadius: '12px',
                        border: 'none',
                        fontSize: '1rem',
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
