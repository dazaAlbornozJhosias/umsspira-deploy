'use client';

import React from 'react';
import { Search, Bell, User, Briefcase, Calendar, Users, Award, Home, GraduationCap } from 'lucide-react';

interface AffinitySiteHeaderProps {
  activeView?: 'recruiter' | 'graduate';
  onToggleView?: (view: 'recruiter' | 'graduate') => void;
}

export const AffinitySiteHeader: React.FC<AffinitySiteHeaderProps> = ({
  activeView = 'recruiter',
  onToggleView,
}) => {
  return (
    <header className="bg-abyssal-blue text-white sticky top-0 z-50 shadow-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-burning-flame text-abyssal-blue flex items-center justify-center shadow-md">
            <GraduationCap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div className="flex items-center space-x-2">
            <span className="font-black text-xl tracking-tight text-white">UMSSPIRA</span>
          </div>
        </div>


        {/* Center Nav Links */}
        <nav className="hidden lg:flex items-center space-x-6 text-xs font-semibold text-slate-300">
          <a href="#" className="hover:text-white transition-colors flex items-center space-x-1">
            <Home className="w-3.5 h-3.5" />
            <span>Inicio</span>
          </a>
          <a href="#" className="hover:text-white transition-colors flex items-center space-x-1">
            <Users className="w-3.5 h-3.5" />
            <span>Comunidad</span>
          </a>
          <a href="#" className="hover:text-white transition-colors flex items-center space-x-1">
            <Briefcase className="w-3.5 h-3.5" />
            <span>Bolsa de trabajo</span>
          </a>
          <a href="#" className="hover:text-white transition-colors flex items-center space-x-1">
            <Award className="w-3.5 h-3.5" />
            <span>Beneficios</span>
          </a>
          <a href="#" className="hover:text-white transition-colors flex items-center space-x-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Eventos</span>
          </a>
        </nav>

        {/* Right User Actions & View Switcher */}
        <div className="flex items-center space-x-3">
          {/* Mode Switcher Pill */}
          {onToggleView && (
            <div className="bg-blue-fantastic p-1 rounded-xl flex items-center border border-slate-700 text-xs">
              <button
                onClick={() => onToggleView('recruiter')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeView === 'recruiter'
                    ? 'bg-burning-flame text-abyssal-blue shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Modo Buscador (Reclutador)
              </button>
              <button
                onClick={() => onToggleView('graduate')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  activeView === 'graduate'
                    ? 'bg-burning-flame text-abyssal-blue shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                Modo Titulado (Mi Afinidad)
              </button>
            </div>
          )}

          <button className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <Search className="w-4 h-4" />
          </button>

          <button className="p-2 text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="w-2 h-2 rounded-full bg-burning-flame absolute top-1.5 right-1.5" />
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs font-semibold text-white cursor-pointer hover:bg-slate-700">
            <div className="w-6 h-6 rounded-full bg-truffle-trouble text-white font-bold flex items-center justify-center text-[10px]">
              MO
            </div>
            <span className="hidden sm:inline">Mauricio Orellana</span>
          </div>
        </div>
      </div>
    </header>
  );
};
