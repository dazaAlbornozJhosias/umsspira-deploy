'use client';

import { useState } from 'react';
import { Lock, Globe, MapPin, Mail, Save, Pencil, Loader2, User, ArrowLeft } from 'lucide-react';
import { cn } from '@/shared/utils/cn';
import type { Company, UpdateCompanyPayload } from '@umsspira/shared-types';
import { CompanyHeader } from '@/app/(dashboard)/companies/company-header';

interface EditCompanyFormProps {
  company: Company;
  onCancel: () => void;
  onSubmit: (data: UpdateCompanyPayload) => Promise<void>;
}

const MAX_DESCRIPTION_LENGTH = 2000;

const TAMANO_OPTIONS = [
  '1-10 empleados',
  '11-50 empleados',
  '50-200 empleados',
  '200+ empleados',
];

export function EditCompanyForm({ company, onCancel, onSubmit }: EditCompanyFormProps) {
  const [formData, setFormData] = useState<Company>(company);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // LÓGICA BACKEND: Si el tamaño guardado en BD no está en la lista actual, se agrega temporalmente para no perderlo.
  const tamanoOptions =
    company.tamano && !TAMANO_OPTIONS.includes(company.tamano)
      ? [company.tamano, ...TAMANO_OPTIONS]
      : TAMANO_OPTIONS;

  const handleChange = (field: keyof Company, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouched((prev) => ({ ...prev, [field]: true }));
    setSubmitError(null);

    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // LÓGICA BACKEND: Validaciones acopladas estrictamente a update-company.dto.ts
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre?.trim()) newErrors.nombre = 'El nombre es obligatorio';
    else if (formData.nombre.length > 100) newErrors.nombre = 'Máximo 100 caracteres';

    if (!formData.descripcion?.trim()) newErrors.descripcion = 'La descripción es obligatoria';
    else if (formData.descripcion.length > MAX_DESCRIPTION_LENGTH) {
      newErrors.descripcion = `Máximo ${MAX_DESCRIPTION_LENGTH} caracteres`;
    }

    if (!formData.tamano?.trim()) newErrors.tamano = 'Selecciona el tamaño de la empresa';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.correo?.trim()) {
      newErrors.correo = 'El correo es obligatorio';
    } else if (!emailRegex.test(formData.correo.trim())) {
      newErrors.correo = 'Correo electrónico inválido';
    }

    const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
    if (!formData.telefono?.trim()) {
      newErrors.telefono = 'El teléfono es obligatorio';
    } else if (!phoneRegex.test(formData.telefono.trim()) || /[a-zA-Z]/.test(formData.telefono)) {
      newErrors.telefono = 'Teléfono inválido (no debe contener letras)';
    }

    const urlRegex = /^https?:\/\/[^\s]+\.[^\s]+$/;
    if (!formData.sitioWeb?.trim()) {
      newErrors.sitioWeb = 'El sitio web es obligatorio';
    } else if (!urlRegex.test(formData.sitioWeb.trim())) {
      newErrors.sitioWeb = 'Debe iniciar con http:// o https:// y no contener espacios';
    } else if (formData.sitioWeb.trim().length > 45) {
      newErrors.sitioWeb = 'Máximo 45 caracteres';
    }

    if (!formData.direccion?.trim()) {
      newErrors.direccion = 'La ubicación es obligatoria';
    } else if (formData.direccion.length > 255) {
      newErrors.direccion = 'Máximo 255 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const { id, nit, ...payload } = formData;
      // Sanitización antes de enviar al backend
      const cleanedPayload: UpdateCompanyPayload = {
        ...payload,
        nombre: payload.nombre.trim(),
        descripcion: payload.descripcion.trim(),
        correo: payload.correo.trim(),
        telefono: payload.telefono.trim(),
        sitioWeb: payload.sitioWeb.trim(),
        direccion: payload.direccion.trim(),
      };
      await onSubmit(cleanedPayload);
    } catch (error) {
      // Captura de errores exactos de la API
      setSubmitError(error instanceof Error ? error.message : 'Ocurrió un error al guardar los cambios. Intente nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData(company);
    setErrors({});
    setTouched({});
    setSubmitError(null);
    onCancel();
  };

  // UI MOCKUP: Bordes dinámicos (Verde, Rojo, Gris)
  const getInputBorderStyle = (field: keyof Company) => {
    const val = formData[field] as string;
    const hasError = !!errors[field];
    const isFieldTouched = touched[field];
    const isValidAndNotEmpty = !hasError && val && val.trim().length > 0;

    if (hasError) return 'border-red-500 ring-1 ring-red-200 bg-red-50/20';
    if (isFieldTouched && isValidAndNotEmpty) return 'border-green-500 ring-1 ring-green-100';
    return 'border-[#C9C1B1]'; // Oatmeal
  };

  const counterColor = (() => {
    const len = formData.descripcion.length;
    if (len >= MAX_DESCRIPTION_LENGTH) return 'text-red-500 font-semibold';
    if (len > MAX_DESCRIPTION_LENGTH * 0.9) return 'text-[#A35139] font-medium';
    return 'text-[#8C827A]';
  })();

  // Helper para renderizar errores de forma limpia
  const fieldError = (field: string) =>
    errors[field] ? (
      <p className="text-[11px] leading-[14px] text-red-500 mt-1 font-medium">{errors[field]}</p>
    ) : null;

  return (
    <div className="w-full space-y-6">
      
      {/* UI MOCKUP: Cabecera visual de la empresa */}
      <CompanyHeader companyName={formData.nombre} />

      {/* UI MOCKUP: Navegación posterior */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={handleCancel}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1B2632] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Volver
        </button>
        <div className="border-b border-[#C9C1B1]">
          <button className="pb-2 text-xs font-bold text-[#FFB162] border-b-2 border-[#FFB162]">
            Información general
          </button>
        </div>
      </div>

      {/* Contenedor del formulario */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="w-full bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-[#C9C1B1] space-y-6"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#EEE9DF] text-[#A35139] border border-[#C9C1B1]">
            <Pencil className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-[#1B2632]">
            Editar perfil de la empresa
          </h2>
        </div>

        {submitError && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm font-semibold">
            {submitError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Nombre de la empresa (Nuevo campo solicitado por backend) */}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#1B2632]">
              Nombre de la empresa <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                value={formData.nombre}
                onChange={(e) => handleChange('nombre', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg text-sm text-[#1B2632] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]/40 transition-colors',
                  getInputBorderStyle('nombre')
                )}
              />
            </div>
            {fieldError('nombre')}
          </div>

          {/* NIT / RUC */}
          <div>
            <label className="text-[13px] font-semibold text-[#1B2632]">
              NIT / RUC <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                value={formData.nit}
                disabled
                readOnly
                className="w-full px-3 py-2 pr-24 bg-[#F4F1EA] border border-[#C9C1B1] rounded-lg text-sm text-[#5C6669] cursor-not-allowed"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[#8C827A] text-xs">
                <Lock className="w-3.5 h-3.5" />
                <span className="text-[10px]">No editable</span>
              </div>
            </div>
          </div>

          {/* Tamaño de la empresa */}
          <div>
            <label className="text-[13px] font-semibold text-[#1B2632]">
              Tamaño de la empresa <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.tamano}
              onChange={(e) => handleChange('tamano', e.target.value)}
              className={cn(
                'w-full px-3 py-2 mt-1 border rounded-lg text-sm text-[#1B2632] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]/40 transition-colors',
                getInputBorderStyle('tamano')
              )}
            >
              <option value="">Selecciona una opción</option>
              {tamanoOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {fieldError('tamano')}
          </div>

          {/* Sitio web */}
          <div>
            <label className="text-[13px] font-semibold text-[#1B2632]">
              Sitio web <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
              <input
                type="text"
                value={formData.sitioWeb}
                onChange={(e) => handleChange('sitioWeb', e.target.value)}
                placeholder="https://www.techsolutions.com"
                className={cn(
                  'w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-[#1B2632] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]/40 transition-colors',
                  getInputBorderStyle('sitioWeb')
                )}
              />
            </div>
            {fieldError('sitioWeb')}
          </div>

          {/* Ubicación */}
          <div>
            <label className="text-[13px] font-semibold text-[#1B2632]">
              Ubicación <span className="text-red-500">*</span>
            </label>
            <div className="relative mt-1">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
              <input
                type="text"
                value={formData.direccion}
                onChange={(e) => handleChange('direccion', e.target.value)}
                placeholder="Av. San Martín y Costanera..."
                className={cn(
                  'w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-[#1B2632] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]/40 transition-colors',
                  getInputBorderStyle('direccion')
                )}
              />
            </div>
            {fieldError('direccion')}
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#1B2632]">
              Descripción <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => {
                if (e.target.value.length <= MAX_DESCRIPTION_LENGTH) {
                  handleChange('descripcion', e.target.value);
                }
              }}
              rows={4}
              className={cn(
                'w-full px-3 py-2 mt-1 border rounded-lg resize-none text-sm text-[#1B2632] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]/40 transition-colors',
                getInputBorderStyle('descripcion')
              )}
            />
            <div className="flex justify-between items-center mt-1">
              {fieldError('descripcion') || <span />}
              <p className={cn('text-[11px] transition-colors ml-auto', counterColor)}>
                {formData.descripcion.length}/{MAX_DESCRIPTION_LENGTH}
              </p>
            </div>
          </div>

          {/* Contacto */}
          <div className="md:col-span-2">
            <label className="text-[13px] font-semibold text-[#1B2632]">
              Contacto <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
              {/* Teléfono */}
              <div>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="+591 71234567"
                    className={cn(
                      'w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-[#1B2632] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]/40 transition-colors',
                      getInputBorderStyle('telefono')
                    )}
                  />
                </div>
                {fieldError('telefono')}
              </div>

              {/* Correo */}
              <div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C827A]" />
                  <input
                    type="email"
                    value={formData.correo}
                    onChange={(e) => handleChange('correo', e.target.value)}
                    placeholder="contacto@empresa.com"
                    className={cn(
                      'w-full pl-9 pr-3 py-2 border rounded-lg text-sm text-[#1B2632] bg-white focus:outline-none focus:ring-2 focus:ring-[#FFB162]/40 transition-colors',
                      getInputBorderStyle('correo')
                    )}
                  />
                </div>
                {fieldError('correo')}
              </div>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-4 border-t border-[#C9C1B1]">
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#E2DBD0] text-[#1B2632] text-sm font-semibold rounded-lg hover:bg-[#D5CCC0] disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2 bg-[#FFB162] text-[#1B2632] text-sm font-semibold rounded-lg hover:bg-[#FFA048] disabled:opacity-50 transition-colors shadow-sm"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
}