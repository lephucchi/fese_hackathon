'use client';

import React from 'react';
import { Citation } from '@/types';

interface CitationBadgeProps {
    number: number;
    onClick?: () => void;
}

export function CitationBadge({ number, onClick }: CitationBadgeProps) {
    return (
        <button
            onClick={onClick}
            className="inline-flex items-center justify-center w-5 h-5 text-xs font-semibold rounded transition-all duration-200 hover:scale-110"
            style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                color: 'white',
            }}
            title={`Nguồn tham chiếu ${number}`}
        >
            {number}
        </button>
    );
}

interface CitationListProps {
    citations: Citation[];
}

export function CitationList({ citations }: CitationListProps) {
    if (citations.length === 0) return null;

    return (
        <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                📚 Nguồn tham chiếu ({citations.length})
            </h4>
            <div className="space-y-2">
                {citations.map((citation) => (
                    <div
                        key={citation.number}
                        id={`citation-${citation.number}`}
                        className="p-3 rounded-lg transition-all duration-200 hover:shadow-md"
                        style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div
                                className="flex-shrink-0 w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
                                style={{
                                    background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                                    color: 'white',
                                }}
                            >
                                {citation.number}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium mb-1" style={{ color: 'var(--primary)' }}>
                                    {citation.source}
                                </div>
                                <p className="text-sm line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                                    {citation.preview}
                                </p>
                                {citation.similarity !== undefined && (
                                    <div className="mt-2 text-xs" style={{ color: 'var(--text-tertiary)' }}>
                                        Độ liên quan: {(citation.similarity * 100).toFixed(1)}%
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
