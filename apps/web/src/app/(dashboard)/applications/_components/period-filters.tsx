'use client';

import { type FormEvent, useState } from 'react';
import type {
  BoardPeriod,
  PeriodFilters,
} from '@/modules/applications/frontend/services/applications-board.service';

const PERIODS: { value: BoardPeriod; label: string }[] = [
  { value: 'last15', label: 'Últimos 15 días' },
  { value: 'last30', label: 'Últimos 30 días' },
  { value: 'semester1', label: 'Semestre I' },
  { value: 'semester2', label: 'Semestre II' },
];

function currentBoliviaYear(): number {
  return Number(
    new Intl.DateTimeFormat('en', {
      timeZone: 'America/La_Paz',
      year: 'numeric',
    }).format(new Date()),
  );
}

interface PeriodFiltersFormProps {
  filters: PeriodFilters;
  onApply: (filters: PeriodFilters) => void;
}

export function PeriodFiltersForm({ filters, onApply }: PeriodFiltersFormProps) {
  const [year, setYear] = useState(String(filters.year ?? currentBoliviaYear()));
  const [from, setFrom] = useState(filters.from ?? '');
  const [to, setTo] = useState(filters.to ?? '');
  const [error, setError] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(filters.period === 'custom');
  const isSemester = filters.period === 'semester1' || filters.period === 'semester2';
  const yearValue = Number(year);
  const isValidYear = Number.isInteger(yearValue) && yearValue >= 2000 && yearValue <= 2100;
  const inputClass =
    'h-9 min-w-0 rounded-md border border-oatmeal bg-palladian px-2 text-xs text-abyssal-blue focus:outline-blue-fantastic';

  function applyPeriod(period: BoardPeriod) {
    if ((period === 'semester1' || period === 'semester2') && !isValidYear) {
      setError('Introduce una gestión entre 2000 y 2100.');
      return;
    }
    setError('');
    onApply({
      period,
      year: period === 'semester1' || period === 'semester2' ? yearValue : undefined,
      from: '',
      to: '',
    });
  }

  function applyCustomRange(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if ((!from && !to) || (from && to && from > to)) {
      setError(!from && !to ? 'Selecciona al menos una fecha.' : 'Desde no puede ser posterior a Hasta.');
      return;
    }
    setError('');
    onApply({ period: 'custom', year: undefined, from, to });
  }

  return (
    <div className="contents">
      <div role="group" aria-label="Periodo de registro" className="min-w-0 lg:col-start-4 lg:row-start-1">
        <span className="mb-1 block text-[10px] font-medium text-abyssal-blue/75">Periodo:</span>
        <div className="flex flex-wrap gap-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              aria-pressed={filters.period === value}
              onClick={() => applyPeriod(value)}
              className={`h-7 rounded-md border px-2 text-[10px] font-medium transition-colors ${
                filters.period === value
                  ? 'border-burning-flame bg-burning-flame text-abyssal-blue'
                  : 'border-oatmeal bg-palladian text-abyssal-blue hover:bg-oatmeal/40'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            aria-expanded={showCustomRange}
            onClick={() => setShowCustomRange((open) => !open)}
            className={`h-7 rounded-md border px-2 text-[10px] font-medium transition-colors ${
              showCustomRange
                ? 'border-burning-flame bg-burning-flame text-abyssal-blue'
                : 'border-oatmeal bg-palladian text-abyssal-blue hover:bg-oatmeal/40'
            }`}
          >
            Fechas
          </button>
        </div>
      </div>

      {isSemester && (
        <label className="flex items-center gap-2 text-[10px] text-abyssal-blue lg:col-start-4 lg:row-start-2">
          Gestión
          <input
            aria-label="Gestión del semestre"
            className={`${inputClass} h-7 w-20 text-[10px]`}
            type="number"
            min="2000"
            max="2100"
            value={year}
            onChange={(event) => setYear(event.target.value)}
          />
          <button
            type="button"
            className="h-7 rounded-md border border-oatmeal bg-palladian px-2 text-[10px] font-medium hover:bg-oatmeal/40"
            onClick={() => applyPeriod(filters.period as BoardPeriod)}
          >
            Aplicar
          </button>
        </label>
      )}

      {showCustomRange && (
        <form
          aria-label="Filtrar por fechas"
          className={`flex flex-wrap items-end gap-2 lg:col-span-2 lg:col-start-4 ${
            isSemester ? 'lg:row-start-3' : 'lg:row-start-2'
          }`}
          onSubmit={applyCustomRange}
        >
          <label className="flex flex-col gap-1 text-[10px] text-abyssal-blue/75">
            Desde
            <input
              aria-label="Desde"
              className={`${inputClass} h-7 text-[10px]`}
              type="date"
              value={from}
              onChange={(event) => {
                setFrom(event.target.value);
                setError('');
              }}
            />
          </label>
          <label className="flex flex-col gap-1 text-[10px] text-abyssal-blue/75">
            Hasta
            <input
              aria-label="Hasta"
              className={`${inputClass} h-7 text-[10px]`}
              type="date"
              value={to}
              onChange={(event) => {
                setTo(event.target.value);
                setError('');
              }}
            />
          </label>
          <button
            type="submit"
            className={`flex h-7 items-center gap-1 rounded-md border px-2 text-[10px] font-medium ${
              filters.period === 'custom'
                ? 'border-burning-flame bg-burning-flame'
                : 'border-oatmeal bg-palladian hover:bg-oatmeal/40'
            }`}
          >
            Aplicar fechas
          </button>
        </form>
      )}
      {isSemester && (
        <p
          className={`text-[9px] text-abyssal-blue/60 lg:col-start-4 ${
            showCustomRange ? 'lg:row-start-4' : 'lg:row-start-3'
          }`}
        >
          Semestre I: ene–jun · Semestre II: jul–dic
        </p>
      )}
      {error && <p role="alert" className="text-xs text-truffle-trouble lg:col-span-2 lg:col-start-4">{error}</p>}
    </div>
  );
}
