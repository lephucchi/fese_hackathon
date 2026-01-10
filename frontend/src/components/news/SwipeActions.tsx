/**
 * Swipe Actions Component
 * Responsibility: Handle accept/reject actions for news cards
 */
'use client';

import { SwipeAction } from '@/types/dashboard.types';

interface SwipeActionsProps {
    readonly onAction: (action: SwipeAction) => void;
    readonly disabled?: boolean;
}

export function SwipeActions({ onAction, disabled = false }: SwipeActionsProps) {
    const handleAction = (action: SwipeAction) => {
        if (disabled) return;
        onAction(action);
    };

    return (
        <div className="swipe-actions">
            <button
                className="swipe-btn reject"
                onClick={() => handleAction('reject')}
                disabled={disabled}
                aria-label="Bỏ qua tin này"
            >
                ✕
            </button>
            <button
                className="swipe-btn accept"
                onClick={() => handleAction('accept')}
                disabled={disabled}
                aria-label="Lưu tin này"
            >
                ✓
            </button>
        </div>
    );
}
