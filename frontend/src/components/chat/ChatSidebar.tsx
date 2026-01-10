'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, MessageSquare, Trash2, X, Menu, Zap } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  messageCount: number;
}

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  history: ChatHistoryItem[];
  activeId: string | null;
  onNewChat: () => void;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
}

// Separate component to handle hover state properly
function ChatHistoryItemComponent({ 
  item, 
  activeId, 
  onSelectChat, 
  onDeleteChat 
}: { 
  item: ChatHistoryItem; 
  activeId: string | null; 
  onSelectChat: (id: string) => void; 
  onDeleteChat: (id: string) => void; 
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      key={item.id}
      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.75rem', borderRadius: '0.5rem', cursor: 'pointer', transition: 'all 0.2s', background: item.id === activeId ? 'var(--background)' : 'transparent', borderLeft: item.id === activeId ? '3px solid var(--primary)' : '3px solid transparent', transform: isHovered ? 'scale(1.02)' : 'scale(1)' }}
      onClick={() => onSelectChat(item.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <MessageSquare size={14} style={{ color: 'var(--text-tertiary)' }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
          {item.title}
        </p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteChat(item.id);
        }}
        style={{ padding: '0.25rem', borderRadius: '0.25rem', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s', opacity: isHovered ? 1 : 0 }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Trash2 size={14} style={{ color: 'var(--error)' }} />
      </button>
    </div>
  );
}

export function ChatSidebar({
  isOpen,
  onToggle,
  history,
  activeId,
  onNewChat,
  onSelectChat,
  onDeleteChat,
}: ChatSidebarProps) {
  const { t } = useLanguage();
  
  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={onToggle}
        style={{ position: 'fixed', top: '4.5rem', left: '1rem', zIndex: 40, width: '2.5rem', height: '2.5rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        aria-label="Toggle sidebar"
      >
        <Menu size={20} style={{ color: 'var(--text-primary)' }} />
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', zIndex: 40 }}
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ position: typeof window !== 'undefined' && window.innerWidth >= 1024 ? 'fixed' : 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50, width: '18rem', display: 'flex', flexDirection: 'column', transition: 'transform 0.3s ease-in-out', transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', background: 'var(--surface)', borderRight: '1px solid var(--border)' }}
      >
        {/* Close button (mobile) */}
        <button
          onClick={onToggle}
          style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem', borderRadius: '0.5rem', background: 'var(--background)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <X size={20} style={{ color: 'var(--text-primary)' }} />
        </button>

        {/* New Chat Button */}
        <div style={{ padding: '1.5rem 1rem 1rem 1rem' }}>
          <button
            onClick={onNewChat}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.75rem', fontWeight: 500, color: 'white', background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)', boxShadow: 'var(--shadow-md)', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Plus size={20} />
            {t('chat.newChat')}
          </button>
        </div>

        {/* Chat History */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 0.75rem 1rem 0.75rem' }}>
          <div style={{ marginBottom: '0.75rem', padding: '0 0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-tertiary)' }}>
              {t('chat.recentChats')}
            </span>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
              <MessageSquare size={28} style={{ color: 'var(--text-tertiary)', opacity: 0.3, margin: '0 auto 0.5rem auto' }} />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-tertiary)' }}>
                {t('chat.noConversations')}
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              {history.map((item) => (
                <ChatHistoryItemComponent
                  key={item.id}
                  item={item}
                  activeId={activeId}
                  onSelectChat={onSelectChat}
                  onDeleteChat={onDeleteChat}
                />
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: '#10b981', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                {t('chat.systemReady')}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <Zap size={12} style={{ color: 'var(--text-tertiary)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                4 {t('chat.indices')}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
