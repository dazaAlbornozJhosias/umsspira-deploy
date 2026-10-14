'use client';
import React, { useState } from 'react';
import { 
  User, CheckCircle, AlertTriangle, BarChart, Bell, Clock 
} from 'lucide-react';

// Importamos correctamente tu componente AdminNavbar modular
import AdminNavbar from '@/shared/components/adminnavbar';

export default function AdminDashboardPage() {
  const [activeNav, setActiveNav] = useState('Reportes');
  const [activeSubTab, setActiveSubTab] = useState('Dashboard');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-slate-900 flex font-sans antialiased overflow-hidden">
      
      {/* Sidebar Modular AdminNavbar */}
      <AdminNavbar activeNav={activeNav} setActiveNav={setActiveNav} />

      {/* 🖥️ CONTENIDO PRINCIPAL DEL PANEL */}
      <div className="flex-grow flex flex-col h-screen overflow-y-auto">
        
        {/* Barra Superior del Panel */}
        <header className="w-full bg-[#FAF7F2] border-b border-slate-200 px-8 h-20 flex items-center justify-between shrink-0">
          
          {/* Hora del Servidor */}
          <div className="flex items-center space-x-2 bg-amber-500/10 border border-amber-500/30 text-amber-800 px-3.5 py-1.5 rounded-xl text-xs font-semibold">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>HORA SERVIDOR: 14:48:22 UTC-4</span>
          </div>

          {/* Perfil del Administrador y Notificaciones */}
          <div className="flex items-center space-x-4">
            <div className="p-2 rounded-full hover:bg-slate-200/60 text-slate-600 cursor-pointer relative transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full"></span>
            </div>
            
            <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
              <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white font-bold flex items-center justify-center text-xs shadow-inner">
                JR
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-slate-900">Ing. José Rojas</p>
                <p className="text-[10px] text-slate-500">Administrador de Carrera</p>
              </div>
            </div>
          </div>

        </header>

        {/* Pestañas de Navegación Interna */}
        <div className="bg-[#FAF7F2] px-8 border-b border-slate-200 flex space-x-8 text-sm font-semibold">
          <button 
            onClick={() => setActiveSubTab('Dashboard')}
            className={`pb-3.5 border-b-2 transition-colors relative cursor-pointer ${
              activeSubTab === 'Dashboard' ? 'border-[#0F172A] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveSubTab('Egresados')}
            className={`pb-3.5 border-b-2 transition-colors relative cursor-pointer ${
              activeSubTab === 'Egresados' ? 'border-[#0F172A] text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-700'
            }`}
          >
            Egresados
          </button>
        </div>

        {/* Contenido Dinámico del Dashboard */}
        <main className="p-8 space-y-8 max-w-[1400px] w-full mx-auto flex-grow">
          
          {/* Banner de Monitoreo */}
          <div className="bg-[#1E293B] text-white p-8 rounded-2xl shadow-lg relative overflow-hidden flex items-center justify-between">
            <div className="space-y-2 z-10">
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">RESUMEN</span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">
                Monitoreo de Egresados — Ing. de Sistemas Computacionales
              </h2>
            </div>
            <div className="hidden sm:flex text-amber-400/90 bg-white/5 p-4 rounded-xl border border-white/10 z-10">
              <BarChart className="w-10 h-10" />
            </div>
          </div>

          {/* 4 Tarjetas de Métricas Principales */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL EGRESADOS REGISTRADOS</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-bold text-slate-900">1,247</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
                <span>↗ +3.4%</span>
                <span className="text-slate-400 font-normal">este mes</span>
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL EGRESADOS VERIFICADOS</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-bold text-slate-900">1,089</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
                <span>↗ +3.4%</span>
                <span className="text-slate-400 font-normal">este mes</span>
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL EGRESADOS OBSERVADOS</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-bold text-slate-900">158</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
                <span>↗ +3.4%</span>
                <span className="text-slate-400 font-normal">este mes</span>
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">TOTAL MENTORES ACTIVOS</span>
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <h3 className="text-3xl font-serif font-bold text-slate-900">34</h3>
              <p className="text-[11px] text-emerald-600 font-medium flex items-center space-x-1">
                <span>↗ +3.4%</span>
                <span className="text-slate-400 font-normal">este mes</span>
              </p>
            </div>

          </div>

          {/* Sección Inferior: Distribución por Gestión y Últimas Solicitudes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
            
            {/* Gráfico / Distribución por Gestión (Ocupa 2 columnas) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
              <h3 className="text-lg font-serif font-bold text-slate-900">Distribución por Gestión</h3>
              
              <div className="space-y-5">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Gestión 2024-II</span>
                    <span className="text-slate-500">482 egresados</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-[#0F172A] h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Gestión 2024-I</span>
                    <span className="text-slate-500">312 egresados</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: '50%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Gestión 2023-II</span>
                    <span className="text-slate-500">295 egresados</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full rounded-full" style={{ width: '45%' }}></div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Gestión 2023-I</span>
                    <span className="text-slate-500">158 egresados</span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div className="bg-[#0F172A] h-full rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Últimas Solicitudes (Ocupa 1 columna) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="text-lg font-serif font-bold text-slate-900">Últimas Solicitudes</h3>
              
              <div className="space-y-4">
                
                <div className="pb-3 border-b border-slate-100 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">Grover Antonio Coca Pinto</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-4">Hace 10 mins • <span className="font-semibold text-slate-700">Estado: Observado</span></p>
                </div>

                <div className="pb-3 border-b border-slate-100 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">Patricia Alejandra Salinas</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-4">Hace 1 hora • <span className="font-semibold text-emerald-600">Estado: Verificado</span></p>
                </div>

                <div className="pb-3 border-b border-slate-100 space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">David Alejandro Zurita</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-4">Hace 3 horas • <span className="font-semibold text-slate-700">Estado: Observado</span></p>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <h4 className="text-xs font-bold text-slate-900">Juan Pablo Mamani Quispe</h4>
                  </div>
                  <p className="text-[11px] text-slate-500 pl-4">Ayer • <span className="font-semibold text-emerald-600">Estado: Verificado</span></p>
                </div>

              </div>
            </div>

          </div>

        </main>

      </div>

    </div>
  );
}
