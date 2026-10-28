import React from 'react';
import { SurveyJobInputsProps } from '../types/survey-job.types';
import { SurveyWorkModalitySelector } from './survey-work-modality-selector';

export const SurveyJobInputs: React.FC<SurveyJobInputsProps> = ({
  values,
  errors,
  touched,
  onChange,
  onBlur,
  disabled = false,
}) => {
  return (
    <div className="space-y-4">
      {/* Fila 1: Cargo y Empresa */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Cargo */}
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="survey-job-cargo" className="text-sm font-semibold text-[#1B2632]">
            Cargo <span className="text-[#A35139]">*</span>
          </label>
          <input
            id="survey-job-cargo"
            name="cargo"
            type="text"
            maxLength={150}
            disabled={disabled}
            value={values.cargo}
            placeholder="Ej. Analista de sistemas"
            onChange={(e) => onChange('cargo', e.target.value)}
            onBlur={() => onBlur('cargo')}
            className={`h-11 rounded-lg border px-3 text-sm text-[#1B2632] placeholder-[#8A8477] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2C3B4D] ${
              touched.cargo && errors.cargo
                ? 'border-2 border-[#A35139] bg-[#EEE9DF]'
                : 'border-[#C9C1B1] bg-[#EEE9DF]'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {touched.cargo && errors.cargo && (
            <span className="text-xs font-medium text-[#A35139]" role="alert">
              {errors.cargo}
            </span>
          )}
        </div>

        {/* Empresa */}
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="survey-job-empresa" className="text-sm font-semibold text-[#1B2632]">
            Empresa <span className="text-[#A35139]">*</span>
          </label>
          <input
            id="survey-job-empresa"
            name="empresa"
            type="text"
            maxLength={200}
            disabled={disabled}
            value={values.empresa}
            placeholder="Ej. Nombre de la empresa"
            onChange={(e) => onChange('empresa', e.target.value)}
            onBlur={() => onBlur('empresa')}
            className={`h-11 rounded-lg border px-3 text-sm text-[#1B2632] placeholder-[#8A8477] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2C3B4D] ${
              touched.empresa && errors.empresa
                ? 'border-2 border-[#A35139] bg-[#EEE9DF]'
                : 'border-[#C9C1B1] bg-[#EEE9DF]'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {touched.empresa && errors.empresa && (
            <span className="text-xs font-medium text-[#A35139]" role="alert">
              {errors.empresa}
            </span>
          )}
        </div>
      </div>

      {/* Fila 2: Area o departamento y Modalidad */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Area */}
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="survey-job-area" className="text-sm font-semibold text-[#1B2632]">
            Área o departamento <span className="text-[#A35139]">*</span>
          </label>
          <input
            id="survey-job-area"
            name="area"
            type="text"
            maxLength={150}
            disabled={disabled}
            value={values.area}
            placeholder="Ej. Desarrollo de software"
            onChange={(e) => onChange('area', e.target.value)}
            onBlur={() => onBlur('area')}
            className={`h-11 rounded-lg border px-3 text-sm text-[#1B2632] placeholder-[#8A8477] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2C3B4D] ${
              touched.area && errors.area
                ? 'border-2 border-[#A35139] bg-[#EEE9DF]'
                : 'border-[#C9C1B1] bg-[#EEE9DF]'
            } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
          />
          {touched.area && errors.area && (
            <span className="text-xs font-medium text-[#A35139]" role="alert">
              {errors.area}
            </span>
          )}
        </div>

        {/* Modalidad de trabajo */}
        <SurveyWorkModalitySelector
          value={values.modalidad}
          error={errors.modalidad}
          touched={touched.modalidad}
          disabled={disabled}
          onChange={(modality) => onChange('modalidad', modality)}
          onBlur={() => onBlur('modalidad')}
        />
      </div>
    </div>
  );
};