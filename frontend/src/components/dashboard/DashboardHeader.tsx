/**
 * Dashboard Header Component
 * Responsibility: Display logo, navigation tabs, and user info
 */
'use client';

import { TabId, UserProfile } from '@/types/dashboard.types';

interface DashboardHeaderProps {
  readonly activeTab: TabId;
  readonly user: UserProfile;
  readonly onTabChange: (tab: TabId) => void;
}

const TAB_CONFIG = [
  { id: 'market' as const, label: 'Thị trường' },
  { id: 'personal' as const, label: 'Tài sản' },
  { id: 'academy' as const, label: 'Học viện' },
] as const;

/**
 * Renders user's initials for avatar
 */
function getUserInitials(name: string): string {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return words[0][0] + words[words.length - 1][0];
  }
  return words[0].substring(0, 2);
}

export function DashboardHeader({ activeTab, user, onTabChange }: DashboardHeaderProps) {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="logo">
          <span>📊</span>
          <span>MacroInsight</span>
        </div>

        <nav className="nav-tabs" role="navigation" aria-label="Main navigation">
          {TAB_CONFIG.map(({ id, label }) => (
            <button
              key={id}
              className={`nav-tab ${activeTab === id ? 'active' : ''}`}
              onClick={() => onTabChange(id)}
              aria-current={activeTab === id ? 'page' : undefined}
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="user-section">
          <div className="points-badge">
            <span>⭐</span>
            <span>{user.points} điểm</span>
          </div>
          <div className="avatar" title={user.name}>
            {getUserInitials(user.name)}
          </div>
        </div>
      </div>
    </header>
  );
}
