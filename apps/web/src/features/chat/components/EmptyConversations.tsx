// apps/web/src/features/chat/components/EmptyConversations.tsx
'use client';

import { Users } from 'lucide-react';

interface Props {
  onStartChat?: () => void;
}

export const EmptyConversations = ({ onStartChat }: Props) => (
  <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
    <Users className="w-8 h-8 text-slate-400" />
    <h2 className="text-sm font-semibold text-slate-900">Aún no tienes conversaciones</h2>
    <p className="text-xs text-slate-500">Busca un contacto para empezar.</p>
    <button
      type="button"
      onClick={onStartChat}
      className="mt-2 px-4 py-2 rounded-lg bg-[#0F172A] text-white text-sm font-medium hover:bg-[#1E293B] transition-colors"
    >
      Iniciar chat
    </button>
  </div>
);