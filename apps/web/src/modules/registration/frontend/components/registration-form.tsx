'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/shared/components/button';
import { Input } from '@/shared/components/input';
import { useRegistration } from '../hooks/use-registration';
import {
  EXPEDITION_DEPARTMENTS,
  EXPEDITION_LABELS,
  MIN_GRADUATION_YEAR,
  personalDataSchema,
  type PersonalDataInput,
  type PersonalDataValues,
} from '../validation/personal-data.schema';
import { FormSelect } from './form-select';

export const VERIFY_EMAIL_PATH = '/register/verify-email';

const FORM_FIELDS: (keyof PersonalDataInput)[] = [
  'nombres',
  'apellidos',
  'ci',
  'complementoCi',
  'expedidoEn',
  'correo',
  'telefono',
  'carreraId',
  'anioEgreso',
  'codigoSis',
];

const EMPTY_VALUES: PersonalDataInput = {
  nombres: '',
  apellidos: '',
  ci: '',
  complementoCi: '',
  expedidoEn: '' as PersonalDataInput['expedidoEn'],
  correo: '',
  telefono: '',
  carreraId: '',
  anioEgreso: '',
  codigoSis: '',
};

const EXPEDITION_OPTIONS = EXPEDITION_DEPARTMENTS.map((code) => ({ value: code, label: EXPEDITION_LABELS[code] }));

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: currentYear - MIN_GRADUATION_YEAR + 1 }, (_, index) => {
    const year = String(currentYear - index);
    return { value: year, label: year };
  });
}

export function RegistrationForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const {
    careers,
    isLoadingCareers,
    careersError,
    savedSessionStatus,
    savedPersonalData,
    expiredMessage,
    submitPersonalData,
  } = useRegistration();

  const yearOptions = useMemo(buildYearOptions, []);
  const careerOptions = useMemo(() => careers.map((career) => ({ value: career.id, label: career.nombre })), [careers]);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<PersonalDataInput, unknown, PersonalDataValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues: EMPTY_VALUES,
  });

  // Si hay un registro en curso, el formulario se muestra con los datos ya cargados (CA-02.7).
  useEffect(() => {
    if (savedPersonalData) {
      reset({
        ...savedPersonalData,
        expedidoEn: savedPersonalData.expedidoEn as PersonalDataInput['expedidoEn'],
        anioEgreso: String(savedPersonalData.anioEgreso),
      });
    }
  }, [savedPersonalData, reset]);

  async function onSubmit(values: PersonalDataValues) {
    setServerError(null);
    const result = await submitPersonalData(values);

    if (result.ok) {
      router.push(VERIFY_EMAIL_PATH);
      return;
    }

    // Se resalta solo el campo indicado por el servidor (CA-01.3 y CA-01.4).
    const fieldErrors = result.errors.filter((error) =>
      FORM_FIELDS.includes(error.field as keyof PersonalDataInput),
    );
    fieldErrors.forEach((error) => {
      setError(error.field as keyof PersonalDataInput, { type: 'server', message: error.message });
    });

    if (fieldErrors.length > 0) {
      setFocus(fieldErrors[0].field as keyof PersonalDataInput);
    } else {
      setServerError(result.message);
    }
  }

  return (
    <section className="rounded-2xl border border-oatmeal bg-white p-6 shadow-sm sm:p-8">
      <header className="mb-6">
        <h1 className="text-[22px] font-bold leading-[30px] text-abyssal-blue sm:text-[32px] sm:leading-10">
          Registro de titulado
        </h1>
        <p className="mt-1 text-[13px] text-abyssal-blue/70 sm:text-sm">
          Completa tus datos personales y académicos para iniciar tu solicitud de registro.
        </p>
      </header>

      {savedSessionStatus === 'expired' && expiredMessage && (
        <div role="alert" className="mb-6 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-sm font-medium text-truffle-trouble">
          {expiredMessage}
        </div>
      )}

      {savedSessionStatus === 'active' && (
        <div className="mb-6 flex flex-col gap-3 rounded-lg border border-oatmeal bg-palladian p-4 text-sm text-abyssal-blue sm:flex-row sm:items-center sm:justify-between">
          <p>Tienes un registro en curso. Puedes continuar con la verificación de tu correo o corregir tus datos.</p>
          <Button type="button" variant="secondary" className="shrink-0" onClick={() => router.push(VERIFY_EMAIL_PATH)}>
            Continuar verificación
          </Button>
        </div>
      )}

      {serverError && (
        <div role="alert" className="mb-6 rounded-lg border border-truffle-trouble/40 bg-truffle-trouble/10 p-3 text-sm font-medium text-truffle-trouble">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        <fieldset className="space-y-4">
          <legend className="mb-1 w-full border-b border-oatmeal/60 pb-1 text-sm font-semibold text-abyssal-blue">
            Datos de identidad
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombres" required autoComplete="given-name" error={errors.nombres?.message} aria-invalid={!!errors.nombres} {...register('nombres')} />
            <Input label="Apellidos" required autoComplete="family-name" error={errors.apellidos?.message} aria-invalid={!!errors.apellidos} {...register('apellidos')} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Número de C.I." required inputMode="numeric" maxLength={10} error={errors.ci?.message} aria-invalid={!!errors.ci} {...register('ci')} />
            <Input label="Complemento de C.I. (Opcional)" placeholder="Ej. 1A" maxLength={2} error={errors.complementoCi?.message} aria-invalid={!!errors.complementoCi} {...register('complementoCi')} />
            <FormSelect label="Expedido en" required placeholder="Selecciona" options={EXPEDITION_OPTIONS} error={errors.expedidoEn?.message} {...register('expedidoEn')} />
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 w-full border-b border-oatmeal/60 pb-1 text-sm font-semibold text-abyssal-blue">
            Contacto
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Correo electrónico" required type="email" autoComplete="email" maxLength={100} error={errors.correo?.message} aria-invalid={!!errors.correo} {...register('correo')} />
            <div className="flex flex-col gap-1.5">
              <label htmlFor="telefono" className="text-[13px] font-semibold text-abyssal-blue">
                Teléfono / WhatsApp<span className="text-truffle-trouble"> *</span>
              </label>
              <div className="flex items-start gap-2">
                <span className="flex h-11 items-center rounded-lg border border-oatmeal bg-palladian px-3 text-sm font-semibold text-abyssal-blue">
                  +591
                </span>
                <div className="flex-1">
                  <Input id="telefono" inputMode="numeric" autoComplete="tel-national" maxLength={8} className="w-full" error={errors.telefono?.message} aria-invalid={!!errors.telefono} {...register('telefono')} />
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="mb-1 w-full border-b border-oatmeal/60 pb-1 text-sm font-semibold text-abyssal-blue">
            Información académica
          </legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormSelect
              label="Carrera"
              required
              placeholder={isLoadingCareers ? 'Cargando carreras...' : 'Selecciona tu carrera'}
              options={careerOptions}
              disabled={isLoadingCareers || careerOptions.length === 0}
              error={errors.carreraId?.message ?? careersError ?? undefined}
              {...register('carreraId')}
            />
            <FormSelect label="Año de egreso" required placeholder="Selecciona el año" options={yearOptions} error={errors.anioEgreso?.message} {...register('anioEgreso')} />
          </div>
          <Input label="Código SIS" required inputMode="numeric" maxLength={9} error={errors.codigoSis?.message} aria-invalid={!!errors.codigoSis} {...register('codigoSis')} />
        </fieldset>

        <div className="flex flex-col-reverse gap-3 border-t border-oatmeal/60 pt-6 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => router.push('/')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Verificando...' : 'Continuar'}
          </Button>
        </div>
      </form>
    </section>
  );
}
