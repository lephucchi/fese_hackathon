'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, X, MessageSquare, Loader2 } from 'lucide-react';
import { useContextChatStream, ThinkingStep } from '@/hooks/useContextChatStream';
import { ThinkingProcess } from './ThinkingProcess';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinkingSteps?: ThinkingStep[];
  totalTimeMs?: number;
}

interface StreamingChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StreamingChatPanel({ isOpen, onClose }: StreamingChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const {
    sendStreamingQuery,
    isStreaming,
    thinkingSteps,
    answer,
    totalTimeMs,
  } = useContextChatStream();

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingSteps, answer]);

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Update assistant message as answer streams in
  useEffect(() => {
    if (answer && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === 'assistant' && lastMessage.content !== answer) {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...lastMessage,
            content: answer,
            thinkingSteps: thinkingSteps,
            totalTimeMs: totalTimeMs,
          };
          return updated;
        });
      }
    }
  }, [answer, thinkingSteps, totalTimeMs, messages]);

  const handleSend = async () => {
    if (!inputValue.trim() || isStreaming) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      thinkingSteps: [],
    };

    setMessages(prev => [...prev, userMessage, assistantMessage]);
    setInputValue('');

    try {
      await sendStreamingQuery(inputValue.trim());
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          ...updated[updated.length - 1],
          content: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại.',
        };
        return updated;
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      style={{
        position: 'fixed',
        right: '1rem',
        bottom: '1rem',
        top: '5rem',
        width: '400px',
        maxWidth: 'calc(100vw - 2rem)',
        background: 'var(--background)',
        borderRadius: '16px',
        border: '1px solid var(--border)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '1rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <MessageSquare size={20} style={{ color: 'var(--primary)' }} />
          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
            AI Chat (Real-time)
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '8px',
            color: 'var(--text-tertiary)',
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        {messages.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-tertiary)',
              padding: '2rem',
            }}
          >
            <MessageSquare size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
            <p>Hỏi AI về tin tức tài chính bạn quan tâm</p>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: message.role === 'user' ? 'flex-end' : 'flex-start',
            }}
          >
            <div
              style={{
                maxWidth: '85%',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background:
                  message.role === 'user'
                    ? 'linear-gradient(135deg, var(--primary), var(--secondary))'
                    : 'var(--surface)',
                color: message.role === 'user' ? 'white' : 'var(--text-primary)',
                border: message.role === 'assistant' ? '1px solid var(--border)' : 'none',
              }}
            >
              {message.role === 'assistant' && message.content === '' && isStreaming ? (
                <>
                  {/* Real-time thinking steps */}
                  <ThinkingProcess steps={thinkingSteps} isActive={isStreaming && !answer} />
                  
                  {/* Streaming answer */}
                  {answer && (
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {answer}
                      </ReactMarkdown>
                    </div>
                  )}
                </>
              ) : message.role === 'assistant' ? (
                <>
                  {/* Completed thinking steps (collapsed) */}
                  {message.thinkingSteps && message.thinkingSteps.length > 0 && (
                    <CollapsibleThinking 
                      steps={message.thinkingSteps} 
                      totalTimeMs={message.totalTimeMs}
                    />
                  )}
                  
                  <div style={{ fontSize: '0.9rem', lineHeight: 1.7 }}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {message.content}
                    </ReactMarkdown>
                  </div>
                </>
              ) : (
                <p style={{ margin: 0, fontSize: '0.9rem' }}>{message.content}</p>
              )}
            </div>
            
            {/* Timestamp */}
            <span
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-tertiary)',
                marginTop: '0.25rem',
              }}
            >
              {message.timestamp.toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
              {message.totalTimeMs && ` • ${(message.totalTimeMs / 1000).toFixed(1)}s`}
            </span>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: '1rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            alignItems: 'center',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Hỏi về tin tức của bạn..."
            disabled={isStreaming}
            style={{
              flex: 1,
              padding: '0.75rem 1rem',
              borderRadius: '12px',
              border: '1px solid var(--border)',
              background: 'var(--background)',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              outline: 'none',
            }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isStreaming}
            style={{
              padding: '0.75rem',
              borderRadius: '12px',
              background: inputValue.trim() && !isStreaming ? 'var(--primary)' : 'var(--surface)',
              color: inputValue.trim() && !isStreaming ? 'white' : 'var(--text-tertiary)',
              border: 'none',
              cursor: inputValue.trim() && !isStreaming ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isStreaming ? (
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// Collapsible thinking component for completed messages
function CollapsibleThinking({ 
  steps, 
  totalTimeMs 
}: { 
  steps: ThinkingStep[]; 
  totalTimeMs?: number 
}) {
  const [expanded, setExpanded] = useState(false);
  
  // Only show done steps
  const doneSteps = steps.filter(s => s.status === 'done');
  
  if (doneSteps.length === 0) return null;

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'var(--background)',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          padding: '0.5rem 0.75rem',
          cursor: 'pointer',
          width: '100%',
          color: 'var(--text-secondary)',
          fontSize: '0.75rem',
        }}
      >
        <span>🧠 {doneSteps.length} bước</span>
        {totalTimeMs && (
          <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>
            {(totalTimeMs / 1000).toFixed(1)}s
          </span>
        )}
        <span>{expanded ? '−' : '+'}</span>
      </button>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ paddingTop: '0.5rem' }}>
              {doneSteps.map((step, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0',
                    color: 'var(--text-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <span style={{ color: '#4ADE80' }}>✓</span>
                  <span>{step.message}</span>
                  {step.elapsed_ms && (
                    <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>
                      {step.elapsed_ms}ms
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
