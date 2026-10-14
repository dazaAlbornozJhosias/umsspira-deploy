'use client';

import React from 'react';
import { GraduateStatus } from '../data/graduates.mock';

export type StatusFilterOption = 'TODOS' | GraduateStatus;

interface GraduatesStatusFilterProps {
  selectedStatus: StatusFilterOption;
  onStatusChange: (status: StatusFilterOption) => void;
}

export function GraduatesStatusFilter({
  selectedStatus,
  onStatusChange,
}: GraduatesStatusFilterProps) {
  return (
    <div className="flex w-full flex-col gap-1.5 sm:w-56">
      <label htmlFor="status-filter" className="sr-only">
        Filtrar por estado
      </label>
      <select
        id="status-filter"
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as StatusFilterOption)}
        className="h-11 w-full rounded-md border border-[#C9C1B1] bg-white px-3 text-sm text-[#1B2632] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#FFB162]"
      >
        <option value="TODOS">Todos los estados</option>
        <option value="VERIFICADO">Titulados verificados</option>
        <option value="OBSERVADO">Titulados observados</option>
      </select>
    </div>
  );
}