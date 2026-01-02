'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types';
import { useChatAPI } from '@/hooks/useChatAPI';
import { useChatHistory } from '@/hooks/useChatHistory';
import {
  ChatTopBar,
  ChatSidebar,
  EnhancedMessageInput,
  EnhancedMessageBubble,
  EnhancedEmptyState,
} from '@/components/chat';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { sendQuery, isLoading } = useChatAPI();
  const { 
    history, 
    createNewChat, 
    saveChat, 
    deleteChat, 
    getChat,
    setActiveId 
  } = useChatHistory();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleSendMessage = async (content: string, mode: 'fast' | 'standard' | 'deep') => {
    let chatId = currentChatId;
    if (!chatId) {
      chatId = createNewChat();
      setCurrentChatId(chatId);
      setActiveId(chatId);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages((prev: Message[]) => [...prev, userMessage, loadingMessage]);

    const response = await sendQuery(content);

    setMessages((prev: Message[]) => {
      const withoutLoading = prev.filter((m: Message) => !m.isLoading);
      
      const assistantMessage: Message = response ? {
        id: Date.now().toString(),
        role: 'assistant',
        content: response.answer,
        timestamp: new Date(),
        response,
      } : {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại.',
        timestamp: new Date(),
      };

      const finalMessages = [...withoutLoading, assistantMessage];
      
      const title = content;
      saveChat(chatId!, title, finalMessages.map((m: Message) => ({ role: m.role, content: m.content })));
      
      return finalMessages;
    });
  };

  const handleExampleQuery = (query: string) => {
    handleSendMessage(query, 'standard');
  };

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
                {messages.map((message: Message) => (
                  <EnhancedMessageBubble key={message.id} message={message} />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          <div style={{ flexShrink: 0, borderTop: '1px solid var(--border)', padding: '1rem', background: 'var(--background)' }}>
            <div style={{ width: '100%', maxWidth: '56rem', margin: '0 auto' }}>
              <EnhancedMessageInput onSend={handleSendMessage} disabled={isLoading} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
