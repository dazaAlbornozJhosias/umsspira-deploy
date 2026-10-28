'use client';

import type { ChangeEvent } from 'react';
import { cn } from '@/shared/utils/cn';

/** Hasta 3 dígitos: 999 meses cubre cualquier tiempo de inserción real. */
export const INSERTION_TIME_MAX_DIGITS = 3;

const VALID_INSERTION_TIME = new RegExp(`^\\d{0,${INSERTION_TIME_MAX_DIGITS}}$`);

/**
 * Decide qué valor queda en el campo. Si lo escrito o pegado tiene algo que no es un dígito
 * (letras, signo menos, punto, espacios) o pasa de 3 dígitos, se rechaza completo y el campo
 * conserva el valor anterior. Así «2.5» no se convierte en «25» ni «-3» en «3».
 */
export function nextInsertionTime(current: string, typed: string): string {
  return VALID_INSERTION_TIME.test(typed) ? typed : current;
}

interface SurveyInsertionTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

/**
 * HU-002 / T2.2: tiempo de inserción laboral en número de meses.
 * Impide ingresar valores no numéricos, al escribir o al pegar (CA de la HU-2).
 */
export function SurveyInsertionTimeInput({ value, onChange, error }: SurveyInsertionTimeInputProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const next = nextInsertionTime(value, event.target.value);
    if (next !== value) onChange(next);
  };

  return (
    <div className="min-w-0">
      <label htmlFor="tiempo-insercion" className="text-sm font-semibold text-abyssal-blue">
        Tiempo de inserción laboral (meses) <span aria-hidden="true">*</span>
      </label>
      <input
        id="tiempo-insercion"
        name="tiempo-insercion"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        placeholder="Ej. 6"
        value={value}
        onChange={handleChange}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'tiempo-insercion-error' : undefined}
        className={cn(
          'mt-2 w-full rounded-lg border bg-white px-3 py-2 text-sm text-abyssal-blue placeholder:text-abyssal-blue/40',
          'focus:outline-none focus:ring-2 focus:ring-truffle-trouble/40',
          error ? 'border-red-500' : 'border-oatmeal',
        )}
      />
      {error && (
        <p id="tiempo-insercion-error" role="alert" className="mt-1 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
