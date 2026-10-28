// apps/web/src/features/chat/components/ConversationItem.tsx
'use client';

import type { ConversationSummary } from '@/shared/services/chat-conversation.service';
import { formatChatTime, getInitials } from '../utils/format';

interface Props {
  conversation: ConversationSummary;
  selected: boolean;
  onSelect: (id: string) => void;
}

export const ConversationItem = ({ conversation, selected, onSelect }: Props) => {
  const { otherUser, lastMessage } = conversation;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={selected ? 'true' : undefined}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-50/60 ${
        selected ? 'bg-amber-50' : ''
      }`}
    >
      <span className="w-10 h-10 shrink-0 rounded-full bg-[#0F172A] text-white text-xs font-semibold flex items-center justify-center">
        {getInitials(otherUser.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">{otherUser.name}</span>
          <span className="shrink-0 text-xs text-slate-400">
            {formatChatTime(lastMessage?.sentAt)}
          </span>
        </span>
        <span className="block text-xs text-slate-500 capitalize">{otherUser.role}</span>
        <span className="block truncate text-xs text-slate-600">
          {lastMessage ? lastMessage.content : 'Aún no hay mensajes'}
        </span>
      </span>
    </button>
  );
};