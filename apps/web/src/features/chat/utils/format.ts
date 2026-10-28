// apps/web/src/features/chat/utils/format.ts
export const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';

export const formatChatTime = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';

  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
};