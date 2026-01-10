/**
 * Personal Tab Component - Profile, Portfolio & Macro Alignment
 * Responsibility: Display user profile, portfolio with macro news impact analysis
 */
'use client';

import { Sparkles, User, Mail, Shield, Crown, Star, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { PortfolioCard } from './PortfolioCard';

// Tier configuration
const TIER_CONFIG: Record<number, { nameKey: string; color: string; bgColor: string; icon: React.ReactNode }> = {
    1: {
        nameKey: 'personal.tiers.normal',
        color: '#6B7280',
        bgColor: 'rgba(107, 114, 128, 0.1)',
        icon: <User size={14} />
    },
    2: {
        nameKey: 'personal.tiers.pro',
        color: '#3B82F6',
        bgColor: 'rgba(59, 130, 246, 0.1)',
        icon: <Star size={14} />
    },
    3: {
        nameKey: 'personal.tiers.business',
        color: '#8B5CF6',
        bgColor: 'rgba(139, 92, 246, 0.1)',
        icon: <Zap size={14} />
    },
    4: {
        nameKey: 'personal.tiers.admin',
        color: '#F59E0B',
        bgColor: 'rgba(245, 158, 11, 0.1)',
        icon: <Crown size={14} />
    },
};

export function PersonalTab() {
    const { t } = useLanguage();
    const { user, isAuthenticated } = useAuth();

    // Get tier info
    const tierInfo = user?.role?.role_id ? TIER_CONFIG[user.role.role_id] : TIER_CONFIG[1];

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: 'clamp(20px, 4vw, 40px) clamp(12px, 3vw, 24px)',
        }}>
            {/* Profile Card */}
            {isAuthenticated && user && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{
                        background: 'var(--card)',
                        borderRadius: '24px',
                        padding: '32px',
                        boxShadow: 'var(--shadow-fintech)',
                        marginBottom: '32px',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {/* Background decoration */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        width: '300px',
                        height: '300px',
                        background: 'radial-gradient(circle, rgba(0, 200, 5, 0.08) 0%, transparent 70%)',
                        pointerEvents: 'none',
                    }} />

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '28px',
                    }}>
                        <Shield size={24} style={{ color: 'var(--primary)' }} />
                        <h2 style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            margin: 0,
                        }}>
                            {t('personal.profile.title')}
                        </h2>
                    </div>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: '40px',
                        alignItems: 'center',
                    }}>
                        {/* Avatar Section */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '16px',
                        }}>
                            {/* Avatar Image */}
                            <div style={{
                                position: 'relative',
                            }}>
                                <div style={{
                                    width: '120px',
                                    height: '120px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    border: '4px solid var(--primary)',
                                    boxShadow: '0 8px 24px rgba(0, 200, 5, 0.25)',
                                }}>
                                    {user.avatar_url ? (
                                        <img
                                            src={user.avatar_url}
                                            alt={user.display_name || 'Avatar'}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                            }}
                                        />
                                    ) : (
                                        <div style={{
                                            width: '100%',
                                            height: '100%',
                                            background: 'linear-gradient(135deg, var(--primary) 0%, #4ADE80 100%)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '3rem',
                                            fontWeight: 700,
                                            color: 'white',
                                        }}>
                                            {user.display_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                {/* Online indicator */}
                                <div style={{
                                    position: 'absolute',
                                    bottom: '8px',
                                    right: '8px',
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    background: '#10B981',
                                    border: '3px solid var(--card)',
                                }} />
                            </div>

                            {/* Tier Badge */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                padding: '8px 16px',
                                borderRadius: '9999px',
                                background: tierInfo.bgColor,
                                border: `1px solid ${tierInfo.color}`,
                            }}>
                                <span style={{ color: tierInfo.color }}>{tierInfo.icon}</span>
                                <span style={{
                                    fontSize: '0.875rem',
                                    fontWeight: 600,
                                    color: tierInfo.color,
                                }}>
                                    {t(tierInfo.nameKey)}
                                </span>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '20px',
                        }}>
                            {/* Name Row */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '24px',
                            }}>
                                {/* First Name */}
                                <div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {t('personal.profile.firstName')}
                                    </div>
                                    <div style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}>
                                        {user.first_name || ''}
                                    </div>
                                </div>

                                {/* Last Name */}
                                <div>
                                    <div style={{
                                        fontSize: '0.75rem',
                                        fontWeight: 500,
                                        color: 'var(--text-secondary)',
                                        marginBottom: '6px',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em',
                                    }}>
                                        {t('personal.profile.lastName')}
                                    </div>
                                    <div style={{
                                        fontSize: '1.125rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                    }}>
                                        {user.last_name || ''}
                                    </div>
                                </div>
                            </div>

                            {/* Display Name */}
                            <div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    {t('personal.profile.displayName')}
                                </div>
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <User size={18} style={{ color: 'var(--primary)' }} />
                                    {user.display_name || user.email.split('@')[0]}
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <div style={{
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                    color: 'var(--text-secondary)',
                                    marginBottom: '6px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                }}>
                                    {t('personal.profile.email')}
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    fontWeight: 500,
                                    color: 'var(--text-primary)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}>
                                    <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                                    {user.email}
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* Portfolio Card - Uses real API */}
            <PortfolioCard />


            {/* Floating Action Button */}
            <Link href="/chat" style={{ textDecoration: 'none' }}>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                        position: 'fixed',
                        bottom: '32px',
                        right: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px 24px',
                        borderRadius: '9999px',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #00a004 100%)',
                        color: 'white',
                        fontSize: '16px',
                        fontWeight: 700,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 8px 24px rgba(0, 200, 5, 0.4)',
                        zIndex: 100,
                    }}
                >
                    <Sparkles size={20} />
                    {t('personal.report.askAI')}
                </motion.button>
            </Link>
        </div>
    );
}
