'use client';
import React, { useState } from 'react';
import Image from 'next/image';

// Importamos la imagen usando la ruta correcta desde shared/assets
import logoUmss from '@/shared/assets/images/umsspiralogo.png';

export default function PublicNavbar() {
  const [activeTab, setActiveTab] = useState<string | null>('Inicio');

  const handleItemClick = (tabName: string, e: React.MouseEvent) => {
    e.preventDefault();
    setActiveTab(tabName);
  };

  const navItems = [
    { name: 'Inicio' },
    { name: 'Comunidad' },
    { name: 'Directorio' },
    { name: 'Carreras' },
    { name: 'Eventos' },
    { name: 'Sobre nosotros' },
  ];

  return (
    <header className="w-full bg-white border-b border-slate-100 shadow-sm font-sans relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo Institucional y Facultad */}
        <div className="flex items-center space-x-3">
          <div className="relative block w-44 h-16 cursor-pointer">
            <Image 
              src={logoUmss} 
              alt="Logo UMSSPIRA" 
              fill 
              className="object-contain object-left"
              priority
            />
          </div>
          <div className="hidden lg:block border-l border-slate-200 pl-3 text-[11px] text-slate-600 font-medium leading-tight">
            <span className="block font-bold text-slate-900">UMSS - FCYT</span>
            <span>INGENIERÍA INFORMÁTICA</span>
            <span className="block">INGENIERÍA DE SISTEMAS</span>
          </div>
        </div>

        {/* Menú de Navegación con efectos sobre fondo blanco */}
        <nav className="hidden md:flex items-center space-x-2 text-base font-medium">
          {navItems.map((item) => {
            const isActive = activeTab === item.name;
            return (
              <button
                key={item.name}
                onClick={(e) => handleItemClick(item.name, e)}
                className={`flex items-center px-3.5 py-2 rounded-xl transition-all relative cursor-pointer ${
                  isActive 
                    ? 'bg-slate-100 text-slate-900 font-semibold shadow-sm' 
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span>{item.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[#FFB162] rounded-full"></span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Botones de Autenticación (Demostrativos sin redirección por ahora) */}
        <div className="flex items-center space-x-3 pr-2">
          <button 
            onClick={(e) => e.preventDefault()}
            className="px-4 py-2 text-sm font-semibold text-slate-800 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
          >
            Iniciar sesión
          </button>
          <button 
            onClick={(e) => e.preventDefault()}
            className="px-4 py-2 text-sm font-semibold text-slate-900 bg-[#FFB162] hover:bg-[#f39c4a] rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            Registro
          </button>
        </div>

      </div>
    </header>
  );
}