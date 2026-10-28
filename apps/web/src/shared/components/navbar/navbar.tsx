'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useId, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, MessageSquare, Search, X } from 'lucide-react';
import { activeSection, navigationFor, NAVBAR_ACCOUNT_LINKS, NAVBAR_ROLE_LABEL, visibleLinks } from './navigation';
import { NavbarLinks } from './navbar-links';
import { ActivityPanel } from './activity-panel';
import { NavbarSearch } from './search-dialog';
import type { NavbarProps } from './types';
import styles from './navbar.module.css';
import { MessagesButton } from './messages-button';
const unchangedHref = (href: string) => href;

/** Contenido real de la barra. Usa useSearchParams, por eso debe ir dentro de <Suspense>. */
function NavbarContent({ session, onLogout, currentPath, resolveHref = unchangedHref, onLogin, onSearch, notifications = [], messages = [], accountExtra }: NavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const path = currentPath ?? pathname ?? '';
  const [pagePath, inlineQuery] = path.split('?');
  const query = inlineQuery ?? searchParams?.toString() ?? '';
  const role = session?.role ?? null;
  const sections = navigationFor(role);
  const accountLinks = visibleLinks(NAVBAR_ACCOUNT_LINKS, role);
  const home = session ? '/portal' : '/portal/institucional';
  // En la raíz del inicio (sin pestaña) no hay sección activa; con ?tab=... la sección de esa pestaña queda activa.
  const active = pagePath === home && !query ? null : activeSection(pagePath, query);
  const homeActive = pagePath === home && !active;
  const [opened, setOpened] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const root = useRef<HTMLElement>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const instance = useId();
  const panelId = (name: string) => `${instance}-navbar-${name}`;

  const sectionOpen = sections.some(section => section.id === opened);
  const close = () => { setOpened(null); setMobile(false); };
  useEffect(() => { setOpened(null); setMobile(false); setSearch(false); }, [pagePath, query, role]);
  useEffect(() => {
    const outside = (event: PointerEvent | FocusEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) {
        setOpened(null);
        setMobile(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpened(null); setMobile(false);
        if (root.current?.contains(document.activeElement)) lastTrigger.current?.focus();
      }
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  const toggle = (name: string, button: HTMLButtonElement) => {
    lastTrigger.current = button;
    setOpened(value => value === name ? null : name);
  };
  const openWithKeyboard = (name: string, button: HTMLButtonElement) => {
    lastTrigger.current = button;
    setOpened(name);
    window.requestAnimationFrame(() => document.getElementById(panelId(name))?.querySelector<HTMLAnchorElement>('a')?.focus());
  };
  const moveFocus = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return;
    const items = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a, button:not([disabled])'));
    if (!items.length) return;
    event.preventDefault();
    const current = items.indexOf(document.activeElement as HTMLElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
    items[next].focus();
  };
  const startSearch = () => { close(); if (onSearch) onSearch(); else setSearch(true); };
  const logout = () => { close(); onLogout(); };

  return <header ref={root} className={`${styles.root} ${session ? styles.member : styles.public}`}>
    <div className={styles.bar}>
      <Link href={resolveHref(home)} className={styles.logo} aria-label="UMSSPIRA: ir al inicio" prefetch={false} onClick={close}>
        <Image src="/assets/events/umsspira-logo-desktop.png" alt="UMSSPIRA" width={170} height={56} priority />
      </Link>
      <nav className={styles.desktopNavigation} aria-label="Navegación principal">
        <Link href={resolveHref(home)} className={`${styles.topLink} ${homeActive && !sectionOpen ? styles.active : ''}`} aria-current={homeActive ? 'page' : undefined} onClick={close} prefetch={false}>Inicio</Link>
        {sections.map(section => <div key={section.id} className={styles.dropdown}>
          <button type="button" className={`${styles.trigger} ${active === section.id || opened === section.id ? styles.active : ''}`} aria-expanded={opened === section.id} aria-controls={panelId(section.id)} onClick={event => toggle(section.id, event.currentTarget)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); openWithKeyboard(section.id, event.currentTarget); } }}>{section.label}<ChevronDown size={13} strokeWidth={2.3} className={opened === section.id ? styles.rotated : undefined} /></button>
          {opened === section.id && <div className={styles.dropdownPanel} id={panelId(section.id)} onKeyDown={moveFocus}><NavbarLinks items={section.items} currentPath={path} resolveHref={resolveHref} onNavigate={close} /></div>}
        </div>)}
      </nav>
      <div className={styles.actions} aria-label="Acciones de cuenta">
        <button type="button" className={styles.iconButton} aria-label="Buscar en la plataforma" onClick={startSearch}><Search size={22} strokeWidth={1.8} /></button>
                {session ? <>
          {/* HU-09: Botón de mensajes independiente */}
          <MessagesButton />
          
          {/* Mapeo solo para Notificaciones (HU-10 se encargará de los mensajes) */}
          {([{ id: 'notifications', label: 'Notificaciones', Icon: Bell, items: notifications }] as const).map(({ id, label, Icon, items }) => <div className={styles.actionDropdown} key={id}>
           <button type="button" className={styles.iconButton} aria-label={label} aria-expanded={opened === id} aria-controls={panelId(id)} onClick={event => toggle(id, event.currentTarget)}><Icon size={22} strokeWidth={1.8} />{items.some(item => item.unread) && <span className={styles.badge} aria-label="Hay elementos sin leer" />}</button>
            {opened === id && <div className={styles.activityPopover} id={panelId(id)} onKeyDown={moveFocus}><ActivityPanel kind={id} items={[...items]} resolveHref={resolveHref} onNavigate={close} /></div>}
          </div>)}
          <span className={styles.separator} aria-hidden="true" />
          <div className={styles.actionDropdown}>
            <button type="button" className={styles.accountTrigger} aria-label={`Menú de ${session.name}`} aria-expanded={opened === 'account'} aria-controls={panelId('account')} onClick={event => toggle('account', event.currentTarget)} onKeyDown={event => { if (event.key === 'ArrowDown') { event.preventDefault(); openWithKeyboard('account', event.currentTarget); } }}><span className={styles.avatar}>{session.initials}</span><span className={styles.profileCopy}><strong>{session.name}</strong><small>{NAVBAR_ROLE_LABEL[session.role]}</small></span><ChevronDown size={15} className={styles.accountChevron} /></button>
            {opened === 'account' && <div className={styles.accountPanel} id={panelId('account')} onKeyDown={moveFocus}><div className={styles.accountHeading}><strong>{session.name}</strong><small>{NAVBAR_ROLE_LABEL[session.role]}</small></div><NavbarLinks items={accountLinks} currentPath={path} resolveHref={resolveHref} onNavigate={close} />{accountExtra && <div className={styles.accountExtra}>{accountExtra}</div>}<button type="button" className={styles.logout} onClick={logout}><LogOut size={16} />Cerrar sesión</button></div>}
          </div>
        </> : <div className={styles.authActions}>{onLogin ? <button type="button" className={styles.login} onClick={() => { close(); onLogin(); }}>Iniciar sesión</button> : <Link href={resolveHref('/login')} className={styles.login} onClick={close} prefetch={false}>Iniciar sesión</Link>}<Link href={resolveHref('/register')} className={styles.register} onClick={close} prefetch={false}>Registro</Link></div>}
        <button type="button" className={styles.mobileToggle} aria-label={mobile ? 'Cerrar navegación principal' : 'Abrir navegación principal'} aria-expanded={mobile} aria-controls={panelId('mobile')} onClick={event => { lastTrigger.current = event.currentTarget; setMobile(!mobile); setOpened(null); }}>{mobile ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
    </div>
    {mobile && <nav className={styles.mobileNavigation} id={panelId('mobile')} aria-label="Navegación móvil"><Link href={resolveHref(home)} className={styles.mobileHome} onClick={close} prefetch={false}>Inicio</Link>{sections.map(section => <div key={section.id}><button type="button" className={styles.mobileSection} aria-expanded={opened === `mobile-${section.id}`} aria-controls={panelId(`mobile-${section.id}`)} onClick={() => setOpened(value => value === `mobile-${section.id}` ? null : `mobile-${section.id}`)}>{section.label}<ChevronDown size={15} /></button>{opened === `mobile-${section.id}` && <div className={styles.mobileLinks} id={panelId(`mobile-${section.id}`)}><NavbarLinks items={section.items} currentPath={path} resolveHref={resolveHref} onNavigate={close} /></div>}</div>)}{session ? <div className={styles.mobileAccount}><strong>Mi cuenta</strong><NavbarLinks items={accountLinks} currentPath={path} resolveHref={resolveHref} onNavigate={close} /><button type="button" className={styles.logout} onClick={logout}><LogOut size={16} />Cerrar sesión</button></div> : <div className={styles.mobileAuth}><Link href={resolveHref('/register')} onClick={close} className={styles.register} prefetch={false}>Crear mi cuenta</Link></div>}</nav>}
    <NavbarSearch open={search} onClose={() => setSearch(false)} links={[{ id: 'home', label: 'Inicio', href: home }, ...sections.flatMap(section => section.items), ...accountLinks]} resolveHref={resolveHref} />
  </header>;
}

/** Mientras se resuelve la URL en el cliente, reserva el espacio de la barra. */
function NavbarFallback({ session }: Pick<NavbarProps, 'session'>) {
  return (
    <header className={`${styles.root} ${session ? styles.member : styles.public}`}>
      <div className={styles.bar} />
    </header>
  );
}

/** Diseño extraído de EventsHeader. No depende de los módulos ni de sus estilos. */
export function Navbar(props: NavbarProps) {
  return (
    <Suspense fallback={<NavbarFallback session={props.session} />}>
      <NavbarContent {...props} />
    </Suspense>
  );
}