// apps/web/src/features/chat/components/ConversationList.tsx
'use client';

import { Loader2 } from 'lucide-react';
import type { ConversationSummary } from '@/shared/services/chat-conversation.service';
import { ConversationItem } from './ConversationItem';
import { EmptyConversations } from './EmptyConversations';

interface Props {
  conversations: ConversationSummary[];
  loading: boolean;
  error: string | null;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onRetry: () => void;
  onStartChat?: () => void;
}

export const ConversationList = ({
  conversations,
  loading,
  error,
  selectedId,
  onSelect,
  onRetry,
  onStartChat,
}: Props) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        Cargando conversaciones...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="text-sm text-red-700">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E293B] transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (conversations.length === 0) {
    return <EmptyConversations onStartChat={onStartChat} />;
  }

  return (
    <ul className="divide-y divide-slate-100 overflow-y-auto">
      {conversations.map((conversation) => (
        <li key={conversation.id}>
          <ConversationItem
            conversation={conversation}
            selected={conversation.id === selectedId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
};