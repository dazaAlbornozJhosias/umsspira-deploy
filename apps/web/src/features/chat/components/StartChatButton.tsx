// apps/web/src/features/chat/components/StartChatButton.tsx
'use client';

import { useStartDirectChat } from '../hooks/useStartDirectChat';
import { MessageSquare } from 'lucide-react';

interface Props {
  targetUserId: string;
  targetName?: string;
  className?: string;
}

export const StartChatButton = ({ targetUserId, targetName, className }: Props) => {
  const { startChat, loading, error } = useStartDirectChat();

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => startChat(targetUserId)}
        disabled={loading}
        className={
          className ??
          'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E293B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        }
      >
        <MessageSquare className="w-4 h-4" />
        {loading
          ? 'Abriendo chat...'
          : `Enviar mensaje${targetName ? ` a ${targetName}` : ''}`}
      </button>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
          {error}
        </p>
      )}
    </div>
  );
};