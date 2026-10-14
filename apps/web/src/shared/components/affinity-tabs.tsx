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
        className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center space-x-1.5 ${
          activeTab === 'calculated'
            ? 'bg-burning-flame text-white'
            : 'text-blue-fantastic hover:text-abyssal-blue'
        }`}
      >
        {activeTab === 'calculated' && <Check className="w-3.5 h-3.5" />}
        <span>Perfil Calculado</span>
      </button>
      <button
        role="tab"
        aria-selected={activeTab === 'customizing'}
        onClick={() => onTabChange('customizing')}
        className={`px-4 py-2 rounded-lg text-[13px] font-semibold transition-all flex items-center space-x-1.5 ${
          activeTab === 'customizing'
            ? 'bg-burning-flame text-white'
            : 'text-blue-fantastic hover:text-abyssal-blue'
        }`}
      >
        {activeTab === 'customizing' && <Check className="w-3.5 h-3.5" />}
        <span>Personalizar</span>
      </button>
    </div>
  );
};
