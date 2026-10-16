'use client';

import Link from 'next/link';
import type { NavbarLink } from './types';
import styles from './navbar.module.css';

export function NavbarLinks({ items, currentPath, resolveHref, onNavigate }: {
  items: NavbarLink[];
  currentPath: string;
  resolveHref: (href: string) => string;
  onNavigate: () => void;
}) {
  return <ul className={styles.linkList}>{items.map(item => <li key={item.id}>
    {item.href ? <Link href={resolveHref(item.href)} className={`${styles.destination} ${currentPath === item.href ? styles.selectedDestination : ''}`} aria-current={currentPath === item.href ? 'page' : undefined} onClick={onNavigate} prefetch={false}>{item.label}</Link> : <div className={styles.pendingDestination} aria-disabled="true"><span>{item.label}</span><small>{item.pending ?? 'Próximamente'}</small></div>}
  </li>)}</ul>;
}
