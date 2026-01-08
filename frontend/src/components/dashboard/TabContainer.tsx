/**
 * Tab Container Component
 * Responsibility: Manage tab visibility and transitions
 */
'use client';

import { ReactNode } from 'react';
import { TabId } from '@/types/dashboard.types';

interface TabContainerProps {
  readonly id: TabId;
  readonly activeTab: TabId;
  readonly children: ReactNode;
}

/**
 * Checks if tab should be visible
 */
function isTabActive(tabId: TabId, activeTabId: TabId): boolean {
  return tabId === activeTabId;
}

export function TabContainer({ id, activeTab, children }: TabContainerProps) {
  const isActive = isTabActive(id, activeTab);
  
  return (
    <div
      className={`tab-content ${isActive ? 'active' : ''}`}
      role="tabpanel"
      aria-hidden={!isActive}
      id={`${id}-tab`}
    >
      {children}
    </div>
  );
}
