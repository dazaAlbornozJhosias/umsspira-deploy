import React from 'react';
import { formatPercentage } from '../utils/percentage';

export interface TopArea {
  id: string;
  label: string;
  score: number;
}

export interface AffinitySummaryCardProps {
  topAreas: TopArea[];
  keywords: string[];
}

export const AffinitySummaryCard: React.FC<AffinitySummaryCardProps> = ({
  topAreas = [],
  keywords = [],
}) => {
  return (
    <div className="bg-[#fcfaf7] border border-gray-200 rounded-xl p-6 mt-6 w-full max-w-md mx-auto">
      {/* Sección 1: Áreas con mayor afinidad */}
      <div className="mb-6">
        <h3 className="flex items-center text-sm font-bold text-gray-800 mb-3">
          <span className="w-2 h-2 rounded-full bg-red-600 mr-2"></span>
          Áreas con mayor afinidad identificadas:
        </h3>
        <div className="flex flex-wrap gap-2">
          {topAreas.map((area, index) => (
            <div
              key={area.id}
              className={`px-3 py-1 text-sm rounded-md font-medium ${
                index === 0
                  ? 'bg-orange-300 text-gray-900'
                  : index === 1
                  ? 'bg-gray-800 text-white'
                  : 'bg-white border border-gray-300 text-gray-700'
              }`}
            >
              {index + 1}. {area.label} ({formatPercentage(area.score)})
            </div>
          ))}
        </div>
      </div>

      {/* Sección 2: Palabras clave más influyentes */}
      <div>
        <h3 className="flex items-center text-sm font-bold text-gray-800 mb-3">
          <span className="w-2 h-2 rounded-full bg-blue-600 mr-2"></span>
          Palabras clave más influyentes:
        </h3>
        <div className="flex flex-wrap gap-2">
          {keywords.map((kw, idx) => (
            <span
              key={idx}
              className="px-3 py-1 text-xs bg-white border border-gray-300 rounded-full text-gray-600"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};