'use client';

import Link from 'next/link';
import { Bell, MessageSquare } from 'lucide-react';
import type { NavbarActivity } from './types';
import styles from './navbar.module.css';

export function ActivityPanel({ kind, items, resolveHref, onNavigate }: {
  kind: 'messages' | 'notifications';
  items: NavbarActivity[];
  resolveHref: (href: string) => string;
  onNavigate: () => void;
}) {
  const title = kind === 'messages' ? 'Mensajes' : 'Notificaciones';
  const Icon = kind === 'messages' ? MessageSquare : Bell;
  return <section className={styles.activityPanel} aria-label={title}><h2>{title}</h2>
    {items.length ? <ul>{items.map(item => <li key={item.id}>{item.href ? <Link href={resolveHref(item.href)} onClick={onNavigate} prefetch={false} className={styles.activityItem}><Icon size={18} /><span><strong>{item.title}</strong><small>{item.description}</small></span>{item.unread && <span className={styles.unread} aria-label="Sin leer" />}</Link> : <div className={styles.activityItem}><Icon size={18} /><span><strong>{item.title}</strong><small>{item.description}</small></span>{item.unread && <span className={styles.unread} aria-label="Sin leer" />}</div>}</li>)}</ul> : <div className={styles.activityEmpty}><Icon size={25} /><p>{kind === 'messages' ? 'No tienes mensajes nuevos.' : 'No tienes notificaciones nuevas.'}</p></div>}
  </section>;
}
