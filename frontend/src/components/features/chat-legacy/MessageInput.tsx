'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder = 'Nhập câu hỏi của bạn...' }: MessageInputProps) {
    const [input, setInput] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '0px';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = Math.min(scrollHeight, 200) + 'px';
        }
    }, [input]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !disabled) {
            onSend(input.trim());
            setInput('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div className="relative flex items-end gap-2 p-4 rounded-2xl glass shadow-lg transition-all duration-200 focus-within:shadow-glow">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={disabled}
                    rows={1}
                    className="flex-1 bg-transparent border-none outline-none resize-none min-h-[24px] max-h-[200px] text-base"
                    style={{ color: 'var(--text-primary)' }}
                />
                <button
                    type="submit"
                    disabled={!input.trim() || disabled}
                    className="flex-shrink-0 w-10 h-10 rounded-xl transition-all duration-200 flex items-center justify-center"
                    style={{
                        background: input.trim() && !disabled ? 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)' : 'var(--surface)',
                        opacity: input.trim() && !disabled ? 1 : 0.5,
                        cursor: input.trim() && !disabled ? 'pointer' : 'not-allowed',
                    }}
                >
                    <SendIcon />
                </button>
            </div>
            <div className="mt-2 px-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                Nhấn <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">Enter</kbd> để gửi, <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800">Shift + Enter</kbd> xuống dòng
            </div>
        </form>
    );
}

function SendIcon() {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}>
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg>
    );
}
