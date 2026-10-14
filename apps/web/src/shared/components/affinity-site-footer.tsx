'use client';

import React from 'react';
import { InstitutionalBanner } from './institutional-banner'; // Importación de tu componente

export const AffinitySiteFooter: React.FC = () => {
  return (
    <footer className="bg-abyssal-blue text-white mt-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Banner Institucional Extraído */}
        <InstitutionalBanner />

        <div className="pt-8 border-t border-slate-800 mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-burning-flame text-abyssal-blue font-black flex items-center justify-center text-xs">
              U
            </div>
            <span className="font-bold text-slate-200">UMSSPIRA</span>
            <span>• Universidad Mayor de San Simón • FCyT</span>
          </div>

          <p className="text-[11px] font-mono">
            © 2026 UMSSPIRA. Sistema de compatibilidad SIG-MATCH e Inteligencia de Competencias.
          </p>
        </div>
      </div>
    </footer>
  );
};
