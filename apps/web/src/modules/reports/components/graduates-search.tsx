'use client';

import React from 'react';
import { Search, RotateCw } from 'lucide-react';

interface GraduatesSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onReset: () => void;
}

export function GraduatesSearch({
  searchTerm,
  onSearchChange,
  onReset,
}: GraduatesSearchProps) {
  return (
    <div className="relative flex-1">
      <label htmlFor="search-graduates" className="sr-only">
        Búsqueda por código SIS o nombre
      </label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#2C3B4D]/60" />
        <input
          id="search-graduates"
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Buscar por código SIS o nombre del titulado..."
          className="h-11 w-full rounded-md border border-[#C9C1B1] bg-white pl-9 pr-10 text-sm text-[#1B2632] placeholder:text-[#2C3B4D]/50 focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={onReset}
            aria-label="Limpiar búsqueda"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2C3B4D]/60 hover:text-[#1B2632]"
          >
            <RotateCw className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}