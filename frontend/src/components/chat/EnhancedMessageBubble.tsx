'use client';

import { motion } from 'framer-motion';
import { Copy, Check, User, Bot, Clock, Zap } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message, Citation } from '@/types';

interface EnhancedMessageBubbleProps {
  message: Message;
}

export function EnhancedMessageBubble({ message }: EnhancedMessageBubbleProps) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', gap: '0.75rem', flexDirection: isUser ? 'row-reverse' : 'row' }}
    >
      {/* Avatar */}
      <div style={{ flexShrink: 0, width: '2.25rem', height: '2.25rem', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', background: isUser ? '#0a8a0a' : 'var(--surface)', border: isUser ? 'none' : '1px solid var(--border)' }}>
        {isUser ? (
          <User size={18} color="white" />
        ) : (
          <Bot size={18} style={{ color: 'var(--primary)' }} />
        )}
      </div>

      {/* Message Content */}
      <div style={{ flex: 1, maxWidth: '80%', display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div style={{ position: 'relative', padding: '0.75rem 1rem', borderRadius: '1rem', borderTopRightRadius: isUser ? '0.125rem' : undefined, borderTopLeftRadius: isUser ? undefined : '0.125rem', background: isUser ? '#0a8a0a' : 'var(--surface)', color: isUser ? '#ffffff' : 'var(--text-primary)', border: isUser ? 'none' : '1px solid var(--border)', boxShadow: isUser ? '0 2px 12px rgba(10, 138, 10, 0.4)' : 'none' }}>
          {message.isLoading ? (
            <LoadingState />
          ) : (
            <>
              {isUser ? (
                <p style={{ fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{message.content}</p>
              ) : (
                <AssistantContent message={message} />
              )}

              {/* Copy button (hover) */}
              <button
                onClick={handleCopy}
                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', padding: '0.375rem', borderRadius: '0.25rem', opacity: 0, background: 'var(--background)', border: 'none', cursor: 'pointer', transition: 'opacity 0.2s' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                title="Copy message"
              >
                {copied ? (
                  <Check size={14} style={{ color: 'var(--success)' }} />
                ) : (
                  <Copy size={14} style={{ color: 'var(--text-tertiary)' }} />
                )}
              </button>
            </>
          )}
        </div>

        {/* Timestamp */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem', fontSize: '0.75rem', color: 'var(--text-tertiary)', justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
          <Clock size={10} />
          <span>{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
}

function LoadingState() {
  const steps = ['Routing query...', 'Searching indices...', 'Generating answer...'];
  const [currentStep, setCurrentStep] = useState(0);

  // Animate through steps
  useState(() => {
    const timer = setInterval(() => {
      setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(timer);
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.25rem 0' }}>
      <div style={{ display: 'flex', gap: '0.25rem' }}>
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            style={{ width: '0.5rem', height: '0.5rem', borderRadius: '9999px', background: 'var(--primary)' }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {steps[currentStep]}
      </span>
    </div>
  );
}

function AssistantContent({ message }: { message: Message & { citations?: Citation[] } }) {
  const { content, response } = message;

  // Get citations from direct message property (streaming) or response (legacy)
  const messageCitations = message.citations || response?.citations || [];

  // Parse citations [1], [2] etc.
  const renderWithCitations = (text: string) => {
    return text.replace(/\[(\d+)\]/g, (match, num) => `**[${num}]**`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Main content with markdown */}
      <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {renderWithCitations(content)}
        </ReactMarkdown>
      </div>

      {/* Metadata */}
      {(response?.metadata || (response?.tier !== undefined && response?.elapsed_ms !== undefined)) && (
        <div style={{ paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', fontSize: '0.75rem' }}>
            {/* Legacy Routes */}
            {response.metadata?.routes?.map((route, i) => (
              <span
                key={i}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', background: 'var(--background)', color: 'var(--text-secondary)' }}
              >
                {getRouteIcon(route)} {getRouteLabel(route)}
              </span>
            ))}

            {/* New Tier Info */}
            {response.tier && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', background: 'var(--background)', color: 'var(--text-secondary)' }}>
                {response.tier === 1 ? '⚡ Cache' : response.tier === 2 ? '🔄 Partial' : '🧠 Pipeline'}
              </span>
            )}

            {/* Legacy Complexity */}
            {response.metadata?.is_complex && (
              <span style={{ padding: '0.25rem 0.5rem', borderRadius: '9999px', color: 'white', background: 'var(--warning)' }}>
                🔍 Complex
              </span>
            )}

            {/* Timing */}
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem', borderRadius: '9999px', background: 'var(--background)', color: 'var(--text-tertiary)' }}>
              <Zap size={12} /> {response.elapsed_ms?.toFixed(0) || response.metadata?.total_time_ms.toFixed(0)}ms
            </span>
          </div>
        </div>
      )}

      {/* Citations - displayed below answer */}
      {messageCitations.length > 0 && (
        <CitationsList citations={messageCitations} />
      )}

      {/* Agent Thought Process Logs */}
      {response?.logs && response.logs.length > 0 && (
        <ThoughtProcess logs={response.logs} />
      )}
    </div>
  );
}

function ThoughtProcess({ logs }: { logs: Array<{ step: string; detail: string; timestamp: number }> }) {
  const [expanded, setExpanded] = useState(false);

  // Calculate relative times
  const startTime = logs.length > 0 ? logs[0].timestamp : 0;

  return (
    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🧠 Agent Thoughts</span>
          <span style={{ fontSize: '0.75rem', padding: '0.125rem 0.5rem', borderRadius: '9999px', background: 'var(--surface-hover)', color: 'var(--text-tertiary)' }}>
            {logs.length} steps
          </span>
        </div>
        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {logs.map((log, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.75rem', paddingLeft: '0.5rem', borderLeft: '2px solid var(--border)' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', textTransform: 'uppercase' }}>
                    {log.step}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                    +{Math.max(0, Math.round(log.timestamp - startTime))}ms
                  </span>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  {log.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CitationsList({ citations }: { citations: Citation[] }) {
  const [expanded, setExpanded] = useState(false);

  if (citations.length === 0) return null;

  const displayedCitations = expanded ? citations : citations.slice(0, 2);

  return (
    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border)' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
      >
        📚 Sources ({citations.length})
        <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          {expanded ? 'Show less' : 'Show all'}
        </span>
      </button>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {displayedCitations.map((citation) => (
          <div
            key={citation.number}
            style={{ padding: '0.75rem', borderRadius: '0.75rem', background: 'var(--background)', border: '1px solid var(--border)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
              <span style={{ flexShrink: 0, width: '1.25rem', height: '1.25rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', background: 'var(--primary)' }}>
                {citation.number}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 500, marginBottom: '0.25rem', color: 'var(--primary)' }}>
                  {citation.source}
                </p>
                <p style={{ fontSize: '0.75rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'var(--text-secondary)' }}>
                  {citation.preview}
                </p>
                {citation.similarity !== undefined && (
                  <p style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-tertiary)' }}>
                    Relevance: {(citation.similarity * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRouteIcon(route: string): string {
  const icons: Record<string, string> = {
    glossary: '📖',
    legal: '⚖️',
    financial: '💰',
    news: '📰',
  };
  return icons[route] || '📄';
}

function getRouteLabel(route: string): string {
  const labels: Record<string, string> = {
    glossary: 'Thuật ngữ',
    legal: 'Pháp lý',
    financial: 'Tài chính',
    news: 'Tin tức',
  };
  return labels[route] || route;
}
