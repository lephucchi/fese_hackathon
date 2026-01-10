'use client';

import { User as UserIcon, Mail, Shield, Edit2 } from 'lucide-react';
import { User } from '@/contexts/AuthContext';

interface ProfileCardProps {
    user: User | null;
    onEdit?: () => void;
}

// Map role_id to tier name
const getTierName = (roleId: number | undefined): string => {
    switch (roleId) {
        case 1:
            return 'Normal';
        case 2:
            return 'Pro';
        case 3:
            return 'Business';
        case 4:
            return 'Admin';
        default:
            return 'Normal';
    }
};

// Get tier badge color
const getTierColor = (roleId: number | undefined): { bg: string; text: string; border: string } => {
    switch (roleId) {
        case 2: // Pro
            return { bg: 'rgba(0, 200, 5, 0.1)', text: '#00C805', border: 'rgba(0, 200, 5, 0.3)' };
        case 3: // Business
            return { bg: 'rgba(102, 126, 234, 0.1)', text: '#667eea', border: 'rgba(102, 126, 234, 0.3)' };
        case 4: // Admin
            return { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444', border: 'rgba(239, 68, 68, 0.3)' };
        default: // Normal
            return { bg: 'rgba(156, 163, 175, 0.1)', text: '#6B7280', border: 'rgba(156, 163, 175, 0.3)' };
    }
};

export function ProfileCard({ user, onEdit }: ProfileCardProps) {
    if (!user) {
        return (
            <div style={{
                background: 'var(--card)',
                borderRadius: '24px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-md)',
            }}>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Vui lòng đăng nhập để xem hồ sơ
                </p>
            </div>
        );
    }

    const tierColors = getTierColor(user.role?.role_id);
    const tierName = getTierName(user.role?.role_id);
    const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();

    // Generate avatar URL if not provided
    const avatarUrl = user.avatar_url ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name || fullName || 'User')}&background=00C805&color=fff&size=128`;

    return (
        <div style={{
            background: 'var(--card)',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: 'var(--shadow-md)',
            marginBottom: '32px',
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '24px',
            }}>
                <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                }}>
                    <UserIcon size={24} style={{ color: 'var(--primary)' }} />
                    Hồ sơ cá nhân
                </h2>
                {onEdit && (
                    <button
                        onClick={onEdit}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: '1px solid var(--border)',
                            background: 'var(--card)',
                            color: 'var(--text-primary)',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--surface)';
                            e.currentTarget.style.borderColor = 'var(--primary)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'var(--card)';
                            e.currentTarget.style.borderColor = 'var(--border)';
                        }}
                    >
                        <Edit2 size={16} />
                        Chỉnh sửa
                    </button>
                )}
            </div>

            {/* Profile Content */}
            <div style={{
                display: 'flex',
                gap: '32px',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
            }}>
                {/* Avatar */}
                <div style={{
                    position: 'relative',
                }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        overflow: 'hidden',
                        border: '4px solid var(--primary)',
                        boxShadow: '0 8px 24px rgba(0, 200, 5, 0.2)',
                    }}>
                        <img
                            src={avatarUrl}
                            alt={user.display_name || 'Avatar'}
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                            }}
                        />
                    </div>
                    {/* Tier Badge */}
                    <div style={{
                        position: 'absolute',
                        bottom: '0',
                        right: '-8px',
                        padding: '4px 12px',
                        borderRadius: '9999px',
                        background: tierColors.bg,
                        border: `1px solid ${tierColors.border}`,
                        fontSize: '12px',
                        fontWeight: 700,
                        color: tierColors.text,
                    }}>
                        {tierName}
                    </div>
                </div>

                {/* User Info */}
                <div style={{
                    flex: 1,
                    minWidth: '250px',
                }}>
                    {/* Display Name */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{
                            fontSize: '2rem',
                            fontWeight: 800,
                            color: 'var(--text-primary)',
                            lineHeight: 1.2,
                            marginBottom: '4px',
                        }}>
                            {user.display_name || fullName || 'Chưa cập nhật'}
                        </div>
                        {fullName && user.display_name && fullName !== user.display_name && (
                            <div style={{
                                fontSize: '1rem',
                                color: 'var(--text-secondary)',
                            }}>
                                {fullName}
                            </div>
                        )}
                    </div>

                    {/* Info Grid */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                        gap: '16px',
                    }}>
                        {/* Email */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                        }}>
                            <Mail size={20} style={{ color: 'var(--text-tertiary)' }} />
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    marginBottom: '2px',
                                }}>
                                    Email
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}>
                                    {user.email}
                                </div>
                            </div>
                        </div>

                        {/* Tier */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                        }}>
                            <Shield size={20} style={{ color: tierColors.text }} />
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    marginBottom: '2px',
                                }}>
                                    Gói dịch vụ
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: tierColors.text,
                                }}>
                                    {tierName}
                                </div>
                            </div>
                        </div>

                        {/* Name Fields */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                        }}>
                            <UserIcon size={20} style={{ color: 'var(--text-tertiary)' }} />
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    marginBottom: '2px',
                                }}>
                                    Họ
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}>
                                    {user.first_name || 'Chưa cập nhật'}
                                </div>
                            </div>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            background: 'var(--surface)',
                            borderRadius: '12px',
                        }}>
                            <UserIcon size={20} style={{ color: 'var(--text-tertiary)' }} />
                            <div>
                                <div style={{
                                    fontSize: '12px',
                                    color: 'var(--text-tertiary)',
                                    marginBottom: '2px',
                                }}>
                                    Tên
                                </div>
                                <div style={{
                                    fontSize: '14px',
                                    fontWeight: 600,
                                    color: 'var(--text-primary)',
                                }}>
                                    {user.last_name || 'Chưa cập nhật'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
