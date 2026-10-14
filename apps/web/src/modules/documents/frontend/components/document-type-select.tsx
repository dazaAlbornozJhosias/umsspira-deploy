'use client';

import React from 'react';
import { cn } from '@/shared/utils/cn';
import { Award, FileText, GraduationCap } from 'lucide-react';

import type { DocumentType } from '../services/document.service';

export type { DocumentType };

export interface DocumentTypeOption {
  value: DocumentType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = [
  {
    value: 'titulo_provision_nacional',
    label: 'Título en Provisión Nal.',
    icon: Award,
  },
  {
    value: 'diploma_academico',
    label: 'Diploma Académico',
    icon: GraduationCap,
  },
  {
    value: 'certificado_egreso',
    label: 'Certificado de Egreso',
    icon: FileText,
  },
];

export interface DocumentTypeSelectProps {
  value: DocumentType | null;
  onChange: (value: DocumentType) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Selector de Tipo de Documento Oficial de Respaldo para Titulados (CA-03.2).
 */
export const DocumentTypeSelect: React.FC<DocumentTypeSelectProps> = ({
  value,
  onChange,
  disabled = false,
  className,
}) => {
  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-[13px] font-semibold text-abyssal">
        Tipo de Documento Oficial <span className="text-truffle-trouble">*</span>
      </label>

      <div
        role="radiogroup"
        aria-label="Tipo de documento oficial"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {DOCUMENT_TYPE_OPTIONS.map((option) => {
          const isSelected = value === option.value;
          const Icon = option.icon;

          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onChange(option.value)}
              className={cn(
                'flex items-center gap-2.5 p-3 rounded-lg text-xs font-semibold transition-all text-left outline-none',
                'border',
                isSelected
                  ? 'border-2 border-blue-fantastic bg-white text-blue-fantastic shadow-sm'
                  : 'border-oatmeal bg-palladian/60 text-abyssal hover:bg-white hover:border-oatmeal/80',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
                  isSelected
                    ? 'bg-blue-fantastic text-white'
                    : 'bg-palladian text-abyssal/70'
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
