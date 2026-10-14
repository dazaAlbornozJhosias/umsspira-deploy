'use client';

import React from 'react';
import { Building2, Download } from 'lucide-react';

export const InstitutionalBanner: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-fantastic to-abyssal-blue p-6 sm:p-8 rounded-2xl border border-slate-700/60 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-3xl">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-truffle-trouble/20 text-burning-flame border border-truffle-trouble/40 text-[10px] font-bold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>CONVENIOS EMPRESARIALES FCYT</span>
          </span>
          <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            ¿Buscas contratar cohortes completas de graduados o formular pasantías institucionales?
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            La Dirección de Interacción Social y la Unidad de Titulación FCyT coordinan procesos de selección directa y validación personalizada de competencias técnicas para empresas aliadas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button type="button" className="px-5 py-2.5 bg-truffle-trouble hover:bg-truffle-trouble/90 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center space-x-2">
            <Building2 className="w-4 h-4" />
            <span>Solicitar Alianza Corporativa</span>
          </button>
          <button type="button" className="px-5 py-2.5 bg-abyssal-blue border border-slate-600 hover:bg-slate-800 text-slate-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center space-x-2">
            <Download className="w-4 h-4 text-slate-400" />
            <span>Descargar Guía de Validación SIS</span>
          </button>
        </div>
      </div>
    </div>
  );
};