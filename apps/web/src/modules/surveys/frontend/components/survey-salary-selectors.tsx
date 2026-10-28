'use client';

import { cn } from '@/shared/utils/cn';

/**
 * HU-002 / T2.2: rangos de salario mensual del mock-up definitivo.
 * El valor que se guarda es la misma etiqueta (salario_mensual VARCHAR(30)).
 */
export const SALARY_RANGES = [
  '0–2.999',
  '3.000–5.000',
  '5.001–8.000',
  '8.001–12.000',
  '12.001–21.000',
] as const;

export type SalaryRange = (typeof SALARY_RANGES)[number];

interface SurveySalarySelectorProps {
  value: string;
  onChange: (value: SalaryRange) => void;
  error?: string;
}

/** Permite elegir un solo rango de salario mensual (CA de la HU-2). */
export function SurveySalarySelector({ value, onChange, error }: SurveySalarySelectorProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-abyssal-blue">
        Salario mensual · rango en Bs <span aria-hidden="true">*</span>
      </legend>

      <div
        className={cn(
          'mt-2 rounded-lg border bg-palladian/60 p-3',
          error ? 'border-red-500' : 'border-oatmeal',
        )}
      >
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SALARY_RANGES.map((range) => {
            const selected = value === range;
            return (
              <label
                key={range}
                className={cn(
                  'flex cursor-pointer flex-col items-center gap-2 rounded-md px-2 py-2 text-center text-xs transition-colors',
                  'focus-within:ring-2 focus-within:ring-truffle-trouble/40',
                  selected ? 'font-semibold text-truffle-trouble' : 'text-abyssal-blue hover:bg-white/70',
                )}
              >
                <input
                  type="radio"
                  name="salario-mensual"
                  value={range}
                  checked={selected}
                  onChange={() => onChange(range)}
                  aria-describedby={error ? 'salario-mensual-error' : undefined}
                  className="sr-only"
                />
                <span
                  aria-hidden="true"
                  className={cn('block h-2 w-full rounded-full', selected ? 'bg-truffle-trouble' : 'bg-oatmeal/70')}
                />
                {range}
              </label>
            );
          })}
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-abyssal-blue/60" aria-hidden="true">
          <span>0 Bs</span>
          <span>21.000 Bs</span>
        </div>
      </div>

      {error && (
        <p id="salario-mensual-error" role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
