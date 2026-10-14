'use client';
import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Home, Calendar, Briefcase, Star, Users, User, Bell, ChevronDown, Award } from 'lucide-react';

import logoUmss from '@/shared/assets/images/logoumsspira.jpg';

import { MobileMenu } from './mobile-menu';

export const NavbarMovil: React.FC = () => {
  const config = {
    height: "h-20",
    logoWidth: "w-28 md:w-44", // CAMBIO 1: logo más chico en móvil
    logoHeight: "h-20",
    spacing: "space-x-3",
    textSize: "text-base",
    itemPaddingX: "px-3",
    itemPaddingY: "py-2",
    notificationPosition: "translate-x-0",
    profilePosition: "translate-x-0",
    rightSectionGap: "space-x-1 md:space-x-4", // CAMBIO 2: menos espacio en móvil
  };

  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'inicio', label: 'Inicio', icon: Home },
    { id: 'eventos', label: 'Eventos', icon: Calendar },
    { id: 'jobs', label: 'Bolsa de trabajo', icon: Briefcase },
    { id: 'mentorias', label: 'Mentorías', icon: Award },
    { id: 'benefits', label: 'Beneficios', icon: Star },
    { id: 'community', label: 'Comunidad', icon: Users },
  ];

  return (
    <header className="w-full bg-[#0F172A] text-white shadow-md font-sans relative z-50">
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${config.height} flex items-center justify-between`}>

        {/* Logo a la izquierda */}
        <div className="flex items-center">
          <Link href="#" className={`relative block ${config.logoWidth} ${config.logoHeight}`}>
            <Image
              src={logoUmss}
              alt="Logo UMSSPIRA"
              fill
              className="object-contain object-left"
              priority
            />
          </Link>
        </div>

        {/* Menú horizontal (se oculta a menos de 768 px) */}
        <nav className={`hidden md:flex items-center ${config.spacing} ${config.textSize} font-medium`}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center space-x-2 ${config.itemPaddingX} ${config.itemPaddingY} rounded-xl transition-all relative ${
                activeTab === id
                  ? 'bg-[#1E293B] text-white'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span>{label}</span>
              {activeTab === id && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFB162] rounded-full"></span>
              )}
            </button>
          ))}
        </nav>

        {/* Sección derecha */}
        {/* CAMBIO 3: shrink-0 evita que se corte, y el padding derecho solo en escritorio */}
        <div className={`flex shrink-0 items-center ${config.rightSectionGap} md:pr-2`}>
          <div className={`p-2.5 rounded-full hover:bg-slate-800 transition-colors relative text-slate-300 hover:text-white cursor-pointer transform ${config.notificationPosition}`}>
            <Bell className="w-6 h-6" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </div>

          <div className={`relative transform ${config.profilePosition}`} ref={dropdownRef}>
            <div
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="flex items-center space-x-2 pl-2 cursor-pointer group py-1"
            >
              <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-slate-900 shadow-inner group-hover:bg-slate-100 transition-colors">
                <User className="w-6 h-6 text-slate-800" />
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 group-hover:text-white transition-transform duration-200 ${isProfileDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {isProfileDropdownOpen && (
              <div className="absolute right-0 mt-3 w-72 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-100 py-3 px-2 z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Usuario UMSS</p>
                    <p className="text-xs text-slate-500">Titulado / Egresado</p>
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
                </div>
              </div>
            )}
          </div>

          {/* Botón hamburguesa (solo móvil) */}
          <MobileMenu />
        </div>

      </div>
    </header>
  );
};