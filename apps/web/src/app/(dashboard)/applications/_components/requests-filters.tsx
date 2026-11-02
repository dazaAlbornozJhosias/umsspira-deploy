'use client';

import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import type { BoardStatus } from '@/modules/applications/frontend/services/applications-board.service';

export interface BoardFilters {
  search: string;
  career: string;
  status: '' | BoardStatus;
  period?: string;
}

export const EMPTY_FILTERS: BoardFilters = { search: '', career: '', status: '' };

const STATUS_OPTIONS: { value: '' | BoardStatus; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'PENDIENTE', label: 'Pendiente de validación' },
  { value: 'OBSERVADA', label: 'Observado' },
  { value: 'APROBADA', label: 'Aprobado' },
  { value: 'RECHAZADA', label: 'Rechazado' },
];

export interface RequestsFiltersProps {
  filters: BoardFilters;
  careers: { id: string; nombre: string }[];
  onChange: (filters: BoardFilters) => void;
  onClear: () => void;
}

// Barra de búsqueda y filtros combinados (CA-04.2).
export function RequestsFilters({ filters, careers, onChange, onClear }: RequestsFiltersProps) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.career !== '' ||
    filters.status !== '' ||
    Boolean(filters.period);

  return (
    <div className="contents">
      <div className="relative min-w-0">
        <Input
          label="Buscar"
          placeholder="Buscar por nombre, C.I. o Código SIS"
          className="h-9 pl-8 text-xs"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
        />
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 text-abyssal-blue/50"
        />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="filter-career" className="text-[10px] font-medium text-abyssal-blue/75">
          Carrera
        </label>
        <select
          id="filter-career"
          value={filters.career}
          onChange={(event) => onChange({ ...filters, career: event.target.value })}
          className="h-9 min-w-0 rounded-md border border-oatmeal bg-palladian px-2 text-xs text-abyssal-blue outline-none focus:border-2 focus:border-blue-fantastic focus:bg-white"
        >
          <option value="">Todas las carreras</option>
          {careers.map((career) => (
            <option key={career.id} value={career.nombre}>
              {career.nombre}
            </option>
          ))}
        </select>
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <label htmlFor="filter-status" className="text-[10px] font-medium text-abyssal-blue/75">
          Estado
        </label>
        <select
          id="filter-status"
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value as BoardFilters['status'] })}
          className="h-9 min-w-0 rounded-md border border-oatmeal bg-palladian px-2 text-xs text-abyssal-blue outline-none focus:border-2 focus:border-blue-fantastic focus:bg-white"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <Button
        type="button"
        variant="secondary"
        onClick={onClear}
        disabled={!hasActiveFilters}
        className="h-9 self-end px-2.5 text-[10px] lg:order-5"
      >
        <RotateCcw aria-hidden="true" className="mr-1.5 h-3 w-3" />
        Limpiar filtros
      </Button>
    </div>
  );
}
