import React from 'react';
import { WorkModality } from '../types/survey-job.types';

interface SurveyWorkModalitySelectorProps {
  value: WorkModality | null;
  error?: string;
  touched?: boolean;
  disabled?: boolean;
  onChange: (value: WorkModality) => void;
  onBlur: () => void;
}

const MODALITY_OPTIONS: { id: WorkModality; label: string }[] = [
  { id: 'Presencial', label: 'Presencial' },
  { id: 'Remoto', label: 'Remoto' },
  { id: 'Hibrido', label: 'Híbrido' },
];

export const SurveyWorkModalitySelector: React.FC<SurveyWorkModalitySelectorProps> = ({
  value,
  error,
  touched,
  disabled = false,
  onChange,
  onBlur,
}) => {
  const hasError = Boolean(touched && error);

  return (
    <div className="flex flex-col space-y-1.5" role="radiogroup" aria-labelledby="modality-label">
      <label id="modality-label" className="text-sm font-semibold text-[#1B2632]">
        Modalidad de trabajo <span className="text-[#A35139]">*</span>
      </label>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {MODALITY_OPTIONS.map((option) => {
          const isSelected = value === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => {
                onChange(option.id);
                onBlur();
              }}
              className={`flex h-11 items-center justify-start rounded-lg border px-3.5 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#2C3B4D] focus:ring-offset-1 ${
                isSelected
                  ? 'border-[#A35139] bg-[#F7F4EE] text-[#1B2632] font-semibold'
                  : hasError
                  ? 'border-[#A35139] bg-[#EEE9DF] text-[#1B2632]'
                  : 'border-[#C9C1B1] bg-[#EEE9DF] text-[#1B2632] hover:bg-[#E6DFD3]'
              } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            >
              <span
                className={`mr-2.5 flex h-4 w-4 items-center justify-center rounded-full border ${
                  isSelected ? 'border-[#A35139]' : 'border-[#C9C1B1]'
                }`}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-[#A35139]" />}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      {hasError && (
        <span className="text-xs font-medium text-[#A35139]" role="alert">
          {error}
        </span>
      )}
    </div>
  );
};