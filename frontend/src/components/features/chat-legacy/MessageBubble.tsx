'use client';

import React from 'react';
import { Message } from '@/types';
import { CitationList, CitationBadge } from './Citation';
import { ThinkingIndicator } from '@/components/common/Loading';

interface MessageBubbleProps {
    message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
    const isUser = message.role === 'user';

    return (
        <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            <div
                className={`max-w-[85%] rounded-2xl px-5 py-3 ${isUser ? 'rounded-br-sm' : 'rounded-bl-sm'}`}
                style={{
                    background: isUser
                        ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)'
                        : 'var(--surface)',
                    color: isUser ? 'white' : 'var(--text-primary)',
                    boxShadow: isUser ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                }}
            >
                {message.isLoading ? (
                    <ThinkingIndicator />
                ) : (
                    <>
                        {isUser ? (
                            <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        ) : (
                            <AssistantMessage content={message.content} response={message.response} />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

interface AssistantMessageProps {
    content: string;
    response?: Message['response'];
}

function AssistantMessage({ content, response }: AssistantMessageProps) {
    // Parse citations from content (format: [1], [2], etc.)
    const renderContentWithCitations = (text: string) => {
        const parts = text.split(/(\[\d+\])/g);

        return parts.map((part, index) => {
            const match = part.match(/\[(\d+)\]/);
            if (match) {
                const citationNumber = parseInt(match[1]);
                return (
                    <CitationBadge
                        key={index}
                        number={citationNumber}
                        onClick={() => {
                            document.getElementById(`citation-${citationNumber}`)?.scrollIntoView({
                                behavior: 'smooth',
                                block: 'center'
                            });
                        }}
                    />
                );
            }
            return <span key={index}>{part}</span>;
        });
    };

    return (
        <div className="space-y-4">
            {/* Answer */}
            <div className="text-base leading-relaxed">
                {renderContentWithCitations(content)}
            </div>

            {/* Metadata */}
            {response?.metadata && (
                <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-wrap gap-2 text-xs">
                        {response.metadata.routes.map((route, i) => (
                            <span
                                key={i}
                                className="px-2 py-1 rounded-full"
                                style={{
                                    background: 'var(--surface-hover)',
                                    color: 'var(--text-secondary)',
                                }}
                            >
                                {getRouteIcon(route)} {getRouteLabel(route)}
                            </span>
                        ))}
                        {response.metadata.is_complex && (
                            <span
                                className="px-2 py-1 rounded-full"
                                style={{
                                    background: 'var(--warning)',
                                    color: 'white',
                                    opacity: 0.9,
                                }}
                            >
                                🔍 Câu hỏi phức tạp
                            </span>
                        )}
                        <span
                            className="px-2 py-1 rounded-full"
                            style={{
                                background: 'var(--surface-hover)',
                                color: 'var(--text-tertiary)',
                            }}
                        >
                            ⚡ {response.metadata.total_time_ms.toFixed(0)}ms
                        </span>
                    </div>
                </div>
            )}

            {/* Citations */}
            {response?.citations && response.citations.length > 0 && (
                <CitationList citations={response.citations} />
            )}
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
