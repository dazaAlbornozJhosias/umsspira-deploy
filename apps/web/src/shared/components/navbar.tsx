'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Home,
  Calendar,
  Briefcase,
  Star,
  Users,
  User,
  Bell,
  ChevronDown,
  Award,
  Menu,
  X,
  LogOut,
  MessageSquare, // 👈 Importado para el botón de mensajes
} from 'lucide-react';

import logoUmss from '@/shared/assets/images/logoumsspira.jpg';
import { authStore } from '@/modules/auth/frontend/store/auth.store';
import { clearSession } from '@/modules/auth/frontend/services/session';
import { hardRedirect } from '@/modules/auth/frontend/services/navigation';
import { clearAccessToken } from '@/shared/services/auth-session';
import { clearToken } from '@/shared/services/api-client';
import { useUnreadSummary } from '@/features/chat/hooks/useUnreadSummary';
import { formatChatTime, getInitials } from '@/features/chat/utils/format';

const MAX_VISIBLE_COUNT = 99;
const formatUnreadCount = (count: number): string =>
  count > MAX_VISIBLE_COUNT ? `${MAX_VISIBLE_COUNT}+` : String(count);

const navItems = [
  { href: '/portal', label: 'Inicio', Icon: Home, exact: true },
  { href: '/portal/eventos', label: 'Eventos', Icon: Calendar },
  { href: '/portal/empleos', label: 'Bolsa de trabajo', Icon: Briefcase },
  { href: '/portal/mentorias', label: 'Mentorías', Icon: Award },
  { href: '/portal/beneficios', label: 'Beneficios', Icon: Star },
  { href: '/portal/comunidad', label: 'Comunidad', Icon: Users },
];

export const Navbar: React.FC<{ eventManagement?: boolean }> = ({
  eventManagement = false,
}) => {
  const items = eventManagement
    ? navItems.map((item) => item.label === 'Eventos'
        ? { ...item, href: '/events' }
        : item)
    : navItems;
  const config = {
    height: 'h-16 lg:h-20',
    logoWidth: 'w-36 lg:w-44',
    logoHeight: 'h-16 lg:h-20',
    spacing: 'space-x-1 xl:space-x-3',
    textSize: 'text-sm xl:text-base',
    itemPaddingX: 'px-2 xl:px-3',
    itemPaddingY: 'py-2',
    notificationPosition: 'translate-x-0',
    profilePosition: 'translate-x-0',
    rightSectionGap: 'space-x-2 lg:space-x-4',
  };

  const pathname = usePathname() ?? '';

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // 👈 NUEVO: Estado y referencia para el panel de mensajes (HU-09)
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const messagesRef = useRef<HTMLDivElement>(null);

  // HU-10: total y últimas conversaciones con mensajes sin leer
  const { summary: unread, reload: reloadUnread } = useUnreadSummary();
  const unreadTotal = unread.total;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Cierre de sesión y limpieza de la sesión local.
  const handleLogout = () => {
    clearSession();
    clearAccessToken();
    clearToken();
    authStore.reset();

    setIsDrawerOpen(false);
    setIsProfileDropdownOpen(false);
    setIsNotificationsOpen(false);
    setIsMessagesOpen(false); // 👈 Cerramos también el de mensajes

    hardRedirect('/login');
  };

  // Cerrar los menús al hacer clic fuera.
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setIsProfileDropdownOpen(false);
      }

      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setIsNotificationsOpen(false);
      }

      // 👈 NUEVO: Cerrar mensajes si se hace clic fuera
      if (messagesRef.current && !messagesRef.current.contains(target)) {
        setIsMessagesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // HU-09 CA-05: cerrar el panel de mensajes con Esc
  useEffect(() => {
    if (!isMessagesOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMessagesOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMessagesOpen]);

  // Cerrar el menú móvil al cambiar de ruta.
  useEffect(() => {
    setIsDrawerOpen(false);
  }, [pathname]);

  // Cerrar el menú móvil con Escape y controlar el foco.
  useEffect(() => {
    if (!isDrawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsDrawerOpen(false);
      }
    };

    document.addEventListener('keydown', onKeyDown);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    closeButtonRef.current?.focus();

    const menuButton = menuButtonRef.current;

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      menuButton?.focus();
    };
  }, [isDrawerOpen]);

  return (
    <>
      <header className="w-full bg-[#0F172A] text-white shadow-md font-sans relative z-50">
        <div
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${config.height} flex items-center justify-between`}
        >
          {/* Logo institucional */}
          <div className="flex items-center">
            <Link
              href="/portal"
              className={`relative block ${config.logoWidth} ${config.logoHeight}`}
            >
              <Image
                src={logoUmss}
                alt="Logo UMSSPIRA"
                fill
                sizes="(min-width: 1024px) 176px, 144px"
                className="object-contain object-left"
                priority
              />
            </Link>
          </div>

          {/* Navegación de escritorio */}
          <nav
            aria-label="Principal"
            className={`hidden lg:flex items-center ${config.spacing} ${config.textSize} font-medium`}
          >
            {items.map(({ href, label, Icon, exact }) => {
              const active = isActive(href, exact);

              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center space-x-2 whitespace-nowrap ${config.itemPaddingX} ${config.itemPaddingY} rounded-xl transition-all relative ${
                    active
                      ? 'bg-[#1E293B] text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-5 h-5 xl:w-6 xl:h-6" />
                  <span>{label}</span>

                  {active && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFB162] rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Acciones de la derecha */}
          <div
            className={`flex items-center ${config.rightSectionGap} lg:pr-2`}
          >
            {/* Mensajes (HU-09) con insignia y pendientes (HU-10) */}
            <div className="relative" ref={messagesRef}>
              <button
                type="button"
                aria-label={
                  unreadTotal > 0 ? `Mensajes: ${unreadTotal} sin leer` : 'Mensajes'
                }
                aria-expanded={isMessagesOpen}
                onClick={() => {
                  if (!isMessagesOpen) void reloadUnread();
                  setIsMessagesOpen((open) => !open);
                }}
                className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors relative text-slate-300 hover:text-white"
              >
                <MessageSquare className="w-6 h-6" />
                {/* CA-01 / CA-02: insignia con el total; sin pendientes no se dibuja */}
                {unreadTotal > 0 && (
                  <span
                    data-testid="messages-unread-badge"
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-0.5 top-0 min-w-[18px] h-[18px] rounded-full bg-[#FFB162] px-1 text-center text-[10px] font-bold leading-[18px] text-[#0F172A]"
                  >
                    {formatUnreadCount(unreadTotal)}
                  </span>
                )}
              </button>

              {isMessagesOpen && (
                <div className="absolute right-0 mt-3 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-100 bg-white text-sm text-slate-600 shadow-2xl z-50">
                  <h3 className="border-b border-slate-100 px-4 py-3 font-bold text-slate-900">
                    Mensajes
                  </h3>

                  {unread.conversations.length > 0 ? (
                    // CA-04: últimas conversaciones con nombre, último mensaje e indicador de no leído
                    <ul className="max-h-[60dvh] divide-y divide-slate-100 overflow-y-auto">
                      {unread.conversations.map((conversation) => (
                        <li key={conversation.id}>
                          <Link
                            href={`/portal/mensajes?conversation=${encodeURIComponent(conversation.id)}`}
                            onClick={() => setIsMessagesOpen(false)}
                            prefetch={false}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-amber-50"
                          >
                            <span
                              aria-hidden="true"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0F172A] text-xs font-semibold text-white"
                            >
                              {getInitials(conversation.otherUser.name)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-slate-900">
                                  {conversation.otherUser.name}
                                </span>
                                <span className="shrink-0 text-[10px] text-slate-400">
                                  {formatChatTime(conversation.lastMessage?.sentAt)}
                                </span>
                              </span>
                              <span className="block text-[10px] capitalize text-slate-400">
                                {conversation.otherUser.role}
                              </span>
                              <span className="block truncate text-xs font-bold text-slate-800">
                                {conversation.lastMessage?.content ?? ''}
                              </span>
                            </span>
                            <span
                              aria-label={`${conversation.unreadCount} sin leer`}
                              className="flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[#b06c30] px-1.5 text-[10px] font-bold text-white"
                            >
                              {formatUnreadCount(conversation.unreadCount)}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    // CA-05: sin pendientes
                    <div className="flex flex-col items-center gap-2 px-4 py-6 text-center text-slate-500">
                      <MessageSquare className="h-6 w-6" aria-hidden="true" />
                      <p className="text-xs">No tienes mensajes nuevos.</p>
                    </div>
                  )}

                  <Link
                    href="/portal/mensajes"
                    onClick={() => setIsMessagesOpen(false)}
                    className="block w-full border-t border-slate-100 py-3 text-center text-sm font-semibold text-amber-600 transition-colors hover:bg-amber-50"
                  >
                    Ver todos los mensajes
                  </Link>
                </div>
              )}
            </div>

            {/* Notificaciones */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                aria-label="Notificaciones"
                aria-expanded={isNotificationsOpen}
                onClick={() =>
                  setIsNotificationsOpen((open) => !open)
                }
                className={`w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-800 transition-colors relative text-slate-300 hover:text-white transform ${config.notificationPosition}`}
              >
                <Bell className="w-6 h-6" />
              </button>

              {isNotificationsOpen && (
                <div
                  role="status"
                  className="absolute right-0 mt-3 w-64 rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-600 shadow-2xl z-50"
                >
                  No tienes notificaciones nuevas.
                </div>
              )}
            </div>

            {/* Perfil de escritorio */}
            <div
              className={`relative hidden lg:block transform ${config.profilePosition}`}
              ref={dropdownRef}
            >
              <button
                type="button"
                aria-label="Abrir menú de perfil"
                aria-expanded={isProfileDropdownOpen}
                onClick={() =>
                  setIsProfileDropdownOpen((open) => !open)
                }
                className="flex items-center space-x-2 pl-2 cursor-pointer group py-1"
              >
                <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-inner group-hover:bg-slate-100 transition-colors">
                  <User className="w-6 h-6 text-slate-800" />
                </div>

                <ChevronDown
                  className={`w-5 h-5 text-slate-400 group-hover:text-white transition-transform duration-200 ${
                    isProfileDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 py-3 px-2 z-50">
                  <div className="px-3 py-2.5 border-b border-slate-100 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                      <User className="w-5 h-5" />
                    </div>

                    <div>
                      <p className="text-sm font-bold text-slate-900">
                        {eventManagement ? 'Administración' : 'Usuario UMSS'}
                      </p>
                      <p className="text-xs text-slate-500">
                        {eventManagement ? 'Administrador de eventos' : 'Titulado / Egresado'}
                      </p>
                    </div>
                  </div>

                  <div className="py-2 space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setIsProfileDropdownOpen(false)}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                    >
                      <div className="flex items-center space-x-2.5">
                        <User className="w-4 h-4 text-slate-500" />
                        <span>Mi perfil</span>
                      </div>
                      <span className="text-slate-400">›</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-xs font-semibold text-slate-700"
                    >
                      <div className="flex items-center space-x-2.5">
                        <LogOut className="w-4 h-4 text-slate-500" />
                        <span>Cerrar sesión</span>
                      </div>
                      <span className="text-slate-400">›</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Botón del menú móvil */}
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Abrir menú"
              aria-expanded={isDrawerOpen}
              aria-controls="mobile-drawer"
              className="lg:hidden w-11 h-11 flex items-center justify-center rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Fondo oscurecido del menú móvil */}
      <div
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
        className={`lg:hidden fixed inset-0 z-[55] bg-black/50 transition-opacity duration-300 ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Menú lateral para móviles y tabletas */}
      <aside
        id="mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menú de navegación"
        aria-hidden={!isDrawerOpen}
        className={`lg:hidden fixed right-0 top-0 z-[60] flex h-full w-72 max-w-[85%] flex-col bg-[#0F172A] text-white shadow-2xl transition-[transform,visibility] duration-300 ${
          isDrawerOpen
            ? 'translate-x-0 visible'
            : 'translate-x-full invisible'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-4">
          <span className="font-serif text-lg font-bold">
            UMSS<span className="text-amber-500">PIRA</span>
          </span>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsDrawerOpen(false)}
            aria-label="Cerrar menú"
            className="w-11 h-11 flex items-center justify-center rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav
          aria-label="Menú móvil"
          className="flex-1 overflow-y-auto px-2 py-4"
        >
          <ul className="space-y-1">
            {items.map(({ href, label, Icon, exact }) => {
              const active = isActive(href, exact);

              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-[44px] items-center space-x-3 rounded-xl px-3 text-sm font-semibold transition-colors ${
                      active
                        ? 'bg-[#1E293B] text-white'
                        : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{label}</span>
                  </Link>
                </li>
              );
            })}

            <li>
              <Link
                href="/profile"
                className="flex min-h-[44px] items-center space-x-3 rounded-xl px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
              >
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-2">
          <button
            type="button"
            onClick={handleLogout}
            className="flex min-h-[44px] w-full items-center space-x-3 rounded-xl px-3 text-left text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800/60 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Navbar;