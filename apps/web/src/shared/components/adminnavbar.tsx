'use client';
import React from 'react';
import Image from 'next/image';
import { 
  Home, ShieldAlert, FileText, Edit3, BarChart2, Calendar as CalendarIcon, 
  Settings 
} from 'lucide-react';

// Importamos la imagen única que ocupará todo ese lugar en el sidebar
import logoCompleto from '../assets/images/logoumsspira.jpg'; // Reemplaza con el nombre de tu archivo

interface AdminNavbarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
} 

export default function AdminNavbar({ activeNav, setActiveNav }: AdminNavbarProps) {
  return (
    <aside className="w-64 bg-[#0F172A] text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 select-none">
      
      {/* Cabecera del Sidebar con la Imagen Única */}
      <div className="p-6 space-y-6">
        {/* Imagen en lugar del texto y cuadrito anterior */}
        <div className="relative w-full h-14">
          <Image 
            src={logoCompleto} 
            alt="Logo UMSSPIRA" 
            fill 
            className="object-contain object-left" 
          />
        </div>

        {/* Menú de Navegación del Sidebar */}
        <nav className="space-y-1.5 pt-2 text-sm font-medium">
          
          <button 
            onClick={() => setActiveNav('Inicio')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'Inicio' ? 'bg-[#1E293B] text-white font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Inicio</span>
          </button>

          <button 
            onClick={() => setActiveNav('Auditoría')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'Auditoría' ? 'bg-[#1E293B] text-white font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span>Auditoria</span>
          </button>

          <button 
            onClick={() => setActiveNav('Reportes')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'Reportes' ? 'bg-[#1E293B] text-white font-semibold shadow-sm' : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <FileText className="w-5 h-5 text-amber-400" />
            <span>Reportes</span>
          </button>

          <button 
            onClick={() => setActiveNav('Encuestas')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'Encuestas' ? 'bg-[#1E293B] text-white font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Edit3 className="w-5 h-5" />
            <span>Encuestas</span>
          </button>

          <button 
            onClick={() => setActiveNav('Analítica')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'Analítica' ? 'bg-[#1E293B] text-white font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span>Analítica</span>
          </button>

          <button 
            onClick={() => setActiveNav('Eventos')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-colors cursor-pointer ${
              activeNav === 'Eventos' ? 'bg-[#1E293B] text-white font-semibold' : 'hover:bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <CalendarIcon className="w-5 h-5" />
            <span>Eventos</span>
          </button>

        </nav>
      </div>

      {/* Footer del Sidebar (Configuración) */}
      <div className="p-6 border-t border-slate-800">
        <button className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl hover:bg-slate-800/60 text-slate-400 hover:text-white transition-colors text-sm font-medium cursor-pointer">
          <Settings className="w-5 h-5" />
          <span>Configuración</span>
        </button>
      </div>

    </aside>
  );
}