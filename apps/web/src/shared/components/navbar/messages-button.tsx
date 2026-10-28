'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { MessageSquare } from 'lucide-react';
import { useUnreadSummary } from '@/features/chat/hooks/useUnreadSummary';
import { formatChatTime, getInitials } from '@/features/chat/utils/format';
import styles from './navbar.module.css';

const MESSAGES_HREF = '/portal/mensajes';
const MAX_VISIBLE_COUNT = 99;

interface MessagesButtonProps {
  onOpen?: () => void;
  isOtherMenuOpen?: boolean;
}

export const formatUnreadCount = (count: number): string =>
  count > MAX_VISIBLE_COUNT ? `${MAX_VISIBLE_COUNT}+` : String(count);

export function MessagesButton({ onOpen, isOtherMenuOpen }: MessagesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  // HU-10: el botón solo se dibuja con sesión (HU-09 CA-02), así que siempre consulta.
  const { summary, reload } = useUnreadSummary();
  const total = summary.total;

  useEffect(() => {
    if (isOtherMenuOpen) setIsOpen(false);
  }, [isOtherMenuOpen]);

  // HU-09 CA-05: cerrar con Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // HU-09 CA-05: cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | FocusEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('focusin', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('focusin', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen) {
      onOpen?.();
      void reload(); // al abrir, el panel muestra lo más reciente
    }
    setIsOpen(!isOpen);
  };

  const label = total > 0 ? `Mensajes: ${total} sin leer` : 'Mensajes';

  return (
    <div className={`${styles.actionDropdown} ${styles.messageAction}`} ref={panelRef}>
      <button
        type="button"
        className={styles.iconButton}
        aria-label={label}
        aria-expanded={isOpen}
        onClick={handleToggle}
      >
        <MessageSquare size={22} strokeWidth={1.8} />
        {/* CA-01 / CA-02: insignia con el total; sin pendientes no se dibuja */}
        {total > 0 && (
          <span className={styles.countBadge} data-testid="messages-unread-badge" aria-hidden="true">
            {formatUnreadCount(total)}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={styles.activityPopover}>
          <div className={styles.activityPanel}>
            <h2>Mensajes</h2>
            {summary.conversations.length > 0 ? (
              // CA-04: últimas conversaciones con nombre, último mensaje e indicador de no leído
              <ul>
                {summary.conversations.map((conversation) => (
                  <li key={conversation.id}>
                    <Link
                      href={`${MESSAGES_HREF}?conversation=${encodeURIComponent(conversation.id)}`}
                      onClick={() => setIsOpen(false)}
                      prefetch={false}
                      className={styles.activityItem}
                    >
                      <span className={styles.messageAvatar} aria-hidden="true">
                        {getInitials(conversation.otherUser.name)}
                      </span>
                      <span className={styles.messageCopy}>
                        <span className={styles.messageHeading}>
                          <strong>{conversation.otherUser.name}</strong>
                          <time>{formatChatTime(conversation.lastMessage?.sentAt)}</time>
                        </span>
                        <small className={styles.messageRole}>{conversation.otherUser.role}</small>
                        <small className={styles.messagePreview}>
                          {conversation.lastMessage?.content ?? ''}
                        </small>
                      </span>
                      <span className={styles.itemCount} aria-label={`${conversation.unreadCount} sin leer`}>
                        {formatUnreadCount(conversation.unreadCount)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              // CA-05: sin pendientes
              <div className={styles.activityEmpty}>
                <MessageSquare size={25} />
                <p>No tienes mensajes nuevos.</p>
              </div>
            )}
            <div style={{ padding: '16px', textAlign: 'center' }}>
              <Link
                href={MESSAGES_HREF}
                onClick={() => setIsOpen(false)}
                style={{ color: '#b06c30', fontWeight: 600, fontSize: '13px', textDecoration: 'none' }}
              >
                Ver todos los mensajes
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}