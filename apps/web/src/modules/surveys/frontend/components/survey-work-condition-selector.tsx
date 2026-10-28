'use client';

import { cn } from '@/shared/utils/cn';
import type { WorkCondition } from '../types/survey.types';

interface SurveyWorkConditionSelectorProps {
  value: WorkCondition | null;
  onChange: (value: WorkCondition) => void;
  error?: string;
}

const OPTIONS: { value: WorkCondition; title: string; hint: string }[] = [
  { value: 'works', title: 'Trabaja', hint: 'Actualmente tengo un empleo' },
  { value: 'not-works', title: 'No trabaja', hint: 'Actualmente no tengo un empleo' },
];

export function SurveyWorkConditionSelector({
  value,
  onChange,
  error,
}: SurveyWorkConditionSelectorProps) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-lg font-semibold text-abyssal-blue">
        1. ¿Cuál es tu situación laboral actual?
      </legend>
      <p className="mt-1 text-sm text-abyssal-blue/70">
        Selecciona una opción. Las preguntas de empleo aparecen solo cuando corresponden.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                'flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors',
                'focus-within:ring-2 focus-within:ring-truffle-trouble/40',
                selected && 'border-truffle-trouble bg-truffle-trouble/10',
                !selected && !error && 'border-oatmeal bg-white hover:bg-palladian',
                !selected && error && 'border-red-500 bg-white',
              )}
            >
              <input
                type="radio"
                name="work-condition"
                value={option.value}
                checked={selected}
                onChange={() => onChange(option.value)}
                aria-describedby={error ? 'work-condition-error' : undefined}
                className="mt-1 accent-truffle-trouble"
              />
              <span className="min-w-0">
                <span className="block font-semibold text-abyssal-blue">
                  {option.title}
                </span>
                <span className="block text-sm text-abyssal-blue/70">
                  {option.hint}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {error && (
        <p id="work-condition-error" role="alert" className="mt-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}