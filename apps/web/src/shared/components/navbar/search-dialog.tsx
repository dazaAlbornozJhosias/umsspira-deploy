'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Search, X } from 'lucide-react';
import type { NavbarLink } from './types';
import styles from './navbar.module.css';

export function NavbarSearch({ open, onClose, links, resolveHref }: {
  open: boolean; onClose: () => void; links: NavbarLink[]; resolveHref: (href: string) => string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [query, setQuery] = useState('');
  useEffect(() => {
    if (open && !dialog.current?.open) dialog.current?.showModal();
    if (!open && dialog.current?.open) dialog.current.close();
  }, [open]);
  const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const unique = links.filter((item, index) => item.href && links.findIndex(other => other.href === item.href) === index);
  const matches = unique.filter(item => normalize(item.label).includes(normalize(query)));
  return <dialog ref={dialog} className={styles.searchDialog} aria-labelledby="official-navbar-search-title" onCancel={onClose} onClose={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div className={styles.searchBody}><div className={styles.searchHeading}><h2 id="official-navbar-search-title">¿A dónde quieres ir?</h2><button type="button" onClick={onClose} className={styles.iconButton} aria-label="Cerrar búsqueda"><X size={21} /></button></div><label className={styles.searchField}><Search size={20} /><input aria-label="Buscar un destino" placeholder="Eventos, mi perfil, reportes…" value={query} onChange={event => setQuery(event.target.value)} /></label><p className={styles.searchHint}>Accesos disponibles para tu sesión.</p><ul className={styles.linkList}>{matches.map(item => <li key={item.href}><Link href={resolveHref(item.href!)} onClick={onClose} prefetch={false} className={styles.searchResult}><span>{item.label}</span><ArrowRight size={16} /></Link></li>)}</ul>{!matches.length && <p className={styles.searchHint}>No se encontró un destino con ese nombre.</p>}</div></dialog>;
}