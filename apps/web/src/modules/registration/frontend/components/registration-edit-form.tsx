'use client';

import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import type { Career } from '../services';
import type { PersonalData } from '../store';
import {
  EXPEDITION_DEPARTMENTS,
  EXPEDITION_LABELS,
  MIN_GRADUATION_YEAR,
  personalDataSchema,
  type PersonalDataInput,
  type PersonalDataValues,
} from '../validation/personal-data.schema';
import { FormSelect } from './form-select';

export type RegistrationEditVariant = 'personal' | 'contact';

export interface RegistrationEditFormProps {
  variant: RegistrationEditVariant;
  personalData: PersonalData;
  careers: Career[];
  isSaving: boolean;
  onSave: (values: PersonalData) => void | Promise<void>;
  onCancel: () => void;
}

const EXPEDITION_OPTIONS = EXPEDITION_DEPARTMENTS.map((code) => ({
  value: code,
  label: EXPEDITION_LABELS[code],
}));

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - MIN_GRADUATION_YEAR + 1 }, (_, index) => {
    const year = String(currentYear - index);
    return { value: year, label: year };
  });
}

const sanitizeName = (value: string) =>
  value.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]/g, '').slice(0, 45);

const sanitizeCi = (value: string) => value.replace(/\D/g, '').slice(0, 10);

/**
 * Edicion directa de una seccion del resumen (HU-07, CA-07.3).
 * Los cambios se conservan en el store hasta que el titulado entrega la solicitud.
 */
export function RegistrationEditForm({
  variant,
  personalData,
  careers,
  isSaving,
  onSave,
  onCancel,
}: RegistrationEditFormProps) {
  const yearOptions = useMemo(buildYearOptions, []);
  const careerOptions = useMemo(() => careers.map((career) => ({ value: career.id, label: career.nombre })), [careers]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PersonalDataInput, unknown, PersonalDataValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: {
      ...personalData,
      complementoCi: personalData.complementoCi ?? '',
      expedidoEn: personalData.expedidoEn as PersonalDataInput['expedidoEn'],
      anioEgreso: String(personalData.anioEgreso) as PersonalDataInput['anioEgreso'],
    },
  });

  async function submit(values: PersonalDataValues) {
    await onSave({ ...personalData, ...values, complementoCi: values.complementoCi ?? '' });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <fieldset disabled={isSaving} className="space-y-4">
      {variant === 'personal' ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Nombres"
              required
              maxLength={45}
              error={errors.nombres?.message}
              {...register('nombres', { onChange: (event) => { event.target.value = sanitizeName(event.target.value); } })}
            />
            <Input
              label="Apellidos"
              required
              maxLength={45}
              error={errors.apellidos?.message}
              {...register('apellidos', { onChange: (event) => { event.target.value = sanitizeName(event.target.value); } })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="Número de C.I."
              required
              inputMode="numeric"
              maxLength={10}
              error={errors.ci?.message}
              {...register('ci', { onChange: (event) => { event.target.value = sanitizeCi(event.target.value); } })}
            />
            <Input
              label="Complemento de C.I. (Opcional)"
              placeholder="Ej. 1A"
              maxLength={2}
              error={errors.complementoCi?.message}
              {...register('complementoCi')}
            />
            <FormSelect
              label="Expedido en"
              required
              placeholder="Selecciona"
              options={EXPEDITION_OPTIONS}
              error={errors.expedidoEn?.message}
              {...register('expedidoEn')}
            />
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Correo electrónico"
              required
              type="email"
              maxLength={30}
              error={errors.correo?.message}
              {...register('correo')}
            />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="telefono-edicion" className="text-[13px] font-semibold text-abyssal-blue">
                Teléfono / WhatsApp<span className="text-truffle-trouble"> *</span>
              </label>
              <div className="flex items-start gap-2">
                <span className="flex h-11 items-center rounded-lg border border-oatmeal bg-palladian px-3 text-sm font-semibold text-abyssal-blue">
                  +591
                </span>
                <Input
                  id="telefono-edicion"
                  inputMode="numeric"
                  maxLength={8}
                  className="w-full"
                  error={errors.telefono?.message}
                  {...register('telefono')}
                />
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Carrera"
              required
              placeholder="Selecciona tu carrera"
              options={careerOptions}
              error={errors.carreraId?.message}
              {...register('carreraId')}
            />
            <FormSelect
              label="Año de egreso"
              required
              placeholder="Selecciona el año"
              options={yearOptions}
              error={errors.anioEgreso?.message}
              {...register('anioEgreso')}
            />
          </div>
          <Input
            label="Código SIS"
            required
            inputMode="numeric"
            maxLength={9}
            error={errors.codigoSis?.message}
            {...register('codigoSis')}
          />
          <p className="text-xs text-abyssal-blue/70">
            Si modificas el correo electrónico, deberás verificarlo nuevamente antes de entregar la solicitud.
          </p>
        </>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-oatmeal/60 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={isSaving}
          className="bg-burning-flame text-abyssal-blue hover:bg-burning-flame/90 hover:text-abyssal-blue disabled:hover:bg-burning-flame focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-abyssal-blue focus-visible:ring-offset-2 "
        >
          {isSaving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </div>
      </fieldset>
    </form>
  );
}
