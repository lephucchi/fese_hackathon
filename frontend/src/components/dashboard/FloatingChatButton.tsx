/**
 * Floating Chat Button Component
 * Responsibility: Provide quick access to chat interface
 */
'use client';

interface FloatingChatButtonProps {
  readonly onClick: () => void;
}

export function FloatingChatButton({ onClick }: FloatingChatButtonProps) {
  return (
    <button
      className="chat-button"
      onClick={onClick}
      aria-label="Mở chat với AI"
      title="Chat với trợ lý AI"
    >
      💬
    </button>
  );
}
