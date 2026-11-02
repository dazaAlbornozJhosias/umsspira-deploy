import React from 'react';
import type { AffinityKeywordContribution } from '@umsspira/shared-types';

interface InfluentialKeywordsProps {
  keywords?: AffinityKeywordContribution[];
}

export const InfluentialKeywords: React.FC<InfluentialKeywordsProps> = ({ keywords = [] }) => {
  // Aseguramos que siempre sea un arreglo para que el CI no explote con .slice() o .map()
const safeKeywords = Array.isArray(keywords) ? keywords : [];

// Mostramos máximo 5 palabras clave según el requerimiento de la tarea 4.2
const displayKeywords = safeKeywords.slice(0, 5);

  if (!displayKeywords || displayKeywords.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-500">
        No hay palabras clave que aporten a esta área.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">
        Palabras clave más influyentes
      </h3>
      <ul className="flex flex-col gap-2">
        {displayKeywords.map((kw, index) => (
          <li key={index} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-md shadow-sm">
            <span className="font-medium text-gray-700 capitalize">{kw.keyword}</span>
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <span>Freq: {kw.frequency}</span>
              <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                {(kw.percentage ?? 0).toFixed(0)}%
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};