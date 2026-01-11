'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useContextChatStream, ThinkingStep, Citation } from '@/hooks/useContextChatStream';
import { useChatHistory } from '@/hooks/useChatHistory';
import { useDisclaimer } from '@/hooks/useDisclaimer';
import { DisclaimerModal } from '@/components/common/DisclaimerModal';
import {
  ChatTopBar,
  ChatSidebar,
  EnhancedMessageInput,
  EnhancedEmptyState,
  ThinkingProcess,
} from '@/components/chat';
import { EnhancedMessageBubble } from '@/components/chat/EnhancedMessageBubble';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Extended Message type with thinking steps and citations
interface StreamingMessage extends Message {
  thinkingSteps?: ThinkingStep[];
  totalTimeMs?: number;
  citations?: Citation[];
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<StreamingMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { 
    sendStreamingQuery, 
    isStreaming, 
    thinkingSteps, 
    answer, 
    citations,
    totalTimeMs 
  } = useContextChatStream();
  const { 
    history, 
    createNewChat, 
    saveChat, 
    deleteChat, 
    getChat,
    setActiveId 
  } = useChatHistory();
  const { hasAccepted, isLoading: disclaimerLoading, acceptDisclaimer } = useDisclaimer();
  
  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/');
    }
  }, [authLoading, isAuthenticated, router]);

  // Show disclaimer on first load if not accepted
  useEffect(() => {
    if (!disclaimerLoading && !hasAccepted && isAuthenticated) {
      setShowDisclaimer(true);
    }
  }, [disclaimerLoading, hasAccepted, isAuthenticated]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingSteps, answer]);

  // Update streaming thinking steps and answer in real-time
  useEffect(() => {
    // Update when we have thinking steps OR answer (not just answer)
    if ((thinkingSteps.length > 0 || answer) && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.isLoading) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMessage,
            content: answer || '',
            isLoading: isStreaming,
            thinkingSteps: thinkingSteps,
            totalTimeMs: totalTimeMs,
            citations: citations,
          };
          return updated;
        });
      }
    }
  }, [answer, thinkingSteps, totalTimeMs, citations, isStreaming, messages]);

  // Handle responsive sidebar
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNewChat = useCallback(() => {
    const newId = createNewChat();
    setCurrentChatId(newId);
    setMessages([]);
    setActiveId(newId);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [createNewChat, setActiveId]);

  const handleSelectChat = useCallback((id: string) => {
    const chat = getChat(id);
    if (chat) {
      setCurrentChatId(id);
      setActiveId(id);
      setMessages(
        chat.messages.map((m: ChatMessage, i: number) => ({
          id: `${id}-${i}`,
          role: m.role,
          content: m.content,
          timestamp: chat.timestamp,
        }))
      );
    }
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [getChat, setActiveId]);

  const handleDeleteChat = useCallback((id: string) => {
    deleteChat(id);
    if (currentChatId === id) {
      setMessages([]);
      setCurrentChatId(null);
    }
  }, [deleteChat, currentChatId]);

  const handleSendMessage = async (content: string) => {
    let chatId = currentChatId;
    if (!chatId) {
      chatId = createNewChat();
      setCurrentChatId(chatId);
      setActiveId(chatId);
    }

    const userMessage: StreamingMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const loadingMessage: StreamingMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
      thinkingSteps: [],
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);

    try {
      await sendStreamingQuery(content);
      
      // After streaming completes, save the final message
      setMessages((prev) => {
        const finalMessages = prev.map((m, i) => {
          if (i === prev.length - 1 && m.role === 'assistant') {
            return { ...m, isLoading: false };
          }
          return m;
        });
        
        // Save to chat history
        const title = content;
        saveChat(chatId!, title, finalMessages.map((m) => ({ role: m.role, content: m.content })));
        
        return finalMessages;
      });
    } catch (error) {
      console.error('Streaming error:', error);
      setMessages((prev) => {
        const withoutLoading = prev.filter((m) => !m.isLoading);
        const errorMessage: StreamingMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại.',
          timestamp: new Date(),
        };
        return [...withoutLoading, errorMessage];
      });
    }
  };

  const handleExampleQuery = (query: string) => {
    handleSendMessage(query);
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--background)' }}>
        <div style={{ width: '2rem', height: '2rem', border: '3px solid var(--border)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style jsx>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--background)' }}>
      <ChatTopBar />

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
        <ChatSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          history={history}
          activeId={currentChatId}
          onNewChat={handleNewChat}
          onSelectChat={handleSelectChat}
          onDeleteChat={handleDeleteChat}
        />

        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, transition: 'margin-left 0.3s ease-in-out', marginLeft: sidebarOpen && typeof window !== 'undefined' && window.innerWidth >= 1024 ? '18rem' : '0' }}>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 1rem' }}>
            {messages.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EnhancedEmptyState onSelectQuery={handleExampleQuery} />
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: '56rem', margin: '0 auto', padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {messages.map((message: StreamingMessage) => (
                  <div key={message.id}>
                    {/* Show thinking process for assistant messages - always visible once available */}
                    {message.role === 'assistant' && (message.thinkingSteps?.length || 0) > 0 && (
                      <ThinkingProcess steps={message.thinkingSteps || []} isActive={Boolean(message.isLoading && !answer)} />
                    )}
                    <EnhancedMessageBubble message={message} />
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--background)' }}>
            <div style={{ width: '100%', maxWidth: '56rem', margin: '0 auto' }}>
              <EnhancedMessageInput onSend={handleSendMessage} disabled={isStreaming} />
            </div>
          </div>
        </main>
      </div>

      {/* Disclaimer Modal */}
      <DisclaimerModal
        isOpen={showDisclaimer}
        onClose={() => {
          // Don't allow closing without accepting
        }}
        onAccept={() => {
          acceptDisclaimer();
          setShowDisclaimer(false);
        }}
      />
    </div>
  );
}
