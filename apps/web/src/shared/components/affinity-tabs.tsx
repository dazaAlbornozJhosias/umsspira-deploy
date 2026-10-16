'use client';

import React from 'react';
import { Check } from 'lucide-react';

export interface AffinityTabsProps {
  activeTab: 'calculated' | 'customizing';
  onTabChange: (tab: 'calculated' | 'customizing') => void;
}

export const AffinityTabs: React.FC<AffinityTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div
      role="tablist"
      className="bg-palladian p-1.5 rounded-xl flex items-center space-x-1 shrink-0 border border-oatmeal"
    >
      <button
        role="tab"
        aria-selected={activeTab === 'calculated'}
        onClick={() => onTabChange('calculated')}
        className={`px-2 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center justify-center space-x-1.5 max-w-[104px] leading-tight ${
          activeTab === 'calculated'
            ? 'bg-burning-flame text-gray-900'
            : 'text-gray-900 hover:text-black'
        }`}
      >
        {activeTab === 'calculated' && <Check className="w-3.5 h-3.5" />}
        <span>Perfil Calculado</span>
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'customizing'}
        onClick={() => onTabChange('customizing')}
        className={`px-2 py-2 rounded-lg text-[13px] font-bold transition-all flex items-center space-x-1.5 ${
          activeTab === 'customizing'
            ? 'bg-burning-flame text-gray-900'
            : 'text-gray-900 hover:text-black'
        }`}
      >
        {activeTab === 'customizing' && <Check className="w-3.5 h-3.5" />}
        <span>Personalizar</span>
      </button>
    </div>
  );
};
