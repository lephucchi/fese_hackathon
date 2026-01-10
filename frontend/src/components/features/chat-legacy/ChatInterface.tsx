'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Message } from '@/types';
import { MessageBubble } from './MessageBubble';
import { MessageInput } from './MessageInput';
import { useChatAPI } from '@/hooks/useChatAPI';

export default function ChatInterface() {
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { sendQuery, isLoading } = useChatAPI();

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (content: string) => {
        // Add user message
        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content,
            timestamp: new Date(),
        };

        // Add loading message
        const loadingMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: '',
            timestamp: new Date(),
            isLoading: true,
        };

        setMessages((prev) => [...prev, userMessage, loadingMessage]);

        // Send query to API
        const response = await sendQuery(content);

        // Remove loading message and add assistant response
        setMessages((prev) => {
            const withoutLoading = prev.filter((m) => !m.isLoading);

            if (response) {
                const assistantMessage: Message = {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: response.answer,
                    timestamp: new Date(),
                    response,
                };
                return [...withoutLoading, assistantMessage];
            }

            // Error case
            const errorMessage: Message = {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Xin lỗi, đã có lỗi xảy ra khi xử lý câu hỏi của bạn. Vui lòng thử lại.',
                timestamp: new Date(),
            };
            return [...withoutLoading, errorMessage];
        });
    };

    return (
        <div className="flex flex-col h-screen max-w-5xl mx-auto">
            {/* Header */}
            <header className="flex-shrink-0 px-6 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gradient">
                            Multi-Index RAG
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Hệ thống Tìm kiếm Thông tin Tài chính & Pháp lý Việt Nam
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <StatusBadge />
                    </div>
                </div>
            </header>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto px-6 py-8"
                style={{ background: 'var(--background)' }}
            >
                {messages.length === 0 ? (
                    <EmptyState />
                ) : (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        {messages.map((message) => (
                            <MessageBubble key={message.id} message={message} />
                        ))}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex-shrink-0 px-6 py-6 border-t" style={{ borderColor: 'var(--border)', background: 'var(--background)' }}>
                <div className="max-w-4xl mx-auto">
                    <MessageInput onSend={handleSendMessage} disabled={isLoading} />
                </div>
            </div>
        </div>
    );
}

function EmptyState() {
    const exampleQueries = [
        "ROE là gì và VNM có ROE bao nhiêu?",
        "Điều 10 Luật Doanh nghiệp quy định gì?",
        "Tin tức mới nhất về VN-Index",
        "P/E của VNM năm 2024 là bao nhiêu?"
    ];

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="mb-8">
                <div className="text-6xl mb-4">🧠</div>
                <h2 className="text-3xl font-bold mb-2 text-gradient">
                    Chào mừng đến với Multi-Index RAG
                </h2>
                <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
                    Đặt câu hỏi về tài chính, pháp lý, hoặc tin tức thị trường Việt Nam
                </p>
            </div>

            <div className="w-full max-w-2xl">
                <p className="text-sm font-medium mb-4" style={{ color: 'var(--text-tertiary)' }}>
                    Ví dụ câu hỏi:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {exampleQueries.map((query, i) => (
                        <button
                            key={i}
                            className="p-4 rounded-xl text-left transition-all duration-200 hover:scale-105"
                            style={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                            }}
                        >
                            <span className="text-sm">{query}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

function StatusBadge() {
    return (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full glass">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Hoạt động
            </span>
        </div>
    );
}
