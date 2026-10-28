'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/shared/components/button';
import type { WorkCondition } from '../types/survey.types';
import { SurveyWorkConditionSelector } from './survey-work-condition-selector';

export function SurveyContainer() {
  // TODO: reemplazar por use-survey-form (Task 1.2, Anelis)
  const [workCondition, setWorkCondition] = useState<WorkCondition | null>(null);
  const [error, setError] = useState<string | undefined>();
  const router = useRouter();

  const handleChange = (value: WorkCondition) => {
    setWorkCondition(value);
    setError(undefined);
  };

  const handleNext = () => {
    if (!workCondition) {
      setError('Seleccione su condición laboral actual');
      return;
    }
    // TODO (Task 1.2 + HU-002): avanzar al siguiente paso cuando use-survey-form
    // y los campos laborales estén integrados.
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6">
      <nav className="text-xs text-abyssal-blue/70">
        Inicio / Encuesta de empleabilidad / Situación laboral
      </nav>

      <h1 className="mt-4 font-display text-3xl font-semibold text-abyssal-blue">
        Encuesta de empleabilidad
      </h1>
      <p className="mt-2 text-sm text-abyssal-blue/70">
        Ayúdanos a conocer tu trayectoria profesional. Solo te preguntaremos lo que
        corresponda a tu situación.
      </p>

      <ol className="mt-6 flex items-center gap-3 text-sm">
        <li className="flex items-center gap-2 font-semibold text-abyssal-blue">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-abyssal-blue text-xs text-white">
            1
          </span>
          Situación laboral
        </li>
        <li className="h-px flex-1 bg-oatmeal" aria-hidden="true" />
        <li className="flex items-center gap-2 text-abyssal-blue/70">
          <span className="flex h-6 w-6 items-center justify-center rounded-full border border-oatmeal bg-white text-xs">
            2
          </span>
          Revisión y envío
        </li>
      </ol>

      <section className="mt-6 rounded-xl border border-oatmeal bg-white p-4 sm:p-6">
        <SurveyWorkConditionSelector
          value={workCondition}
          onChange={handleChange}
          error={error}
        />

        <hr className="my-5 border-oatmeal" />

        {workCondition === null && (
          <div className="rounded-lg border border-oatmeal bg-palladian p-4 text-sm">
            <p className="font-semibold text-abyssal-blue">
              Formulario adaptado a tu condición laboral
            </p>
            <p className="text-abyssal-blue/70">
              Cuando selecciones Trabaja aparecerán inmediatamente las preguntas
              correspondientes.
            </p>
          </div>
        )}

        {workCondition === 'works' && (
          <div>
            {/* Aquí irán los campos de HU-002 (Task 2.1 y 2.2) */}
          </div>
        )}

        {workCondition === 'not-works' && (
          <div className="rounded-lg border border-oatmeal bg-palladian p-4 text-sm">
            <p className="font-semibold text-abyssal-blue">
              No necesitas completar datos de empleo actual
            </p>
            <p className="text-abyssal-blue/70">
              Al seleccionar No trabaja se ocultan los campos laborales y puedes
              continuar sin llenarlos.
            </p>
          </div>
        )}
      </section>

      <p className="mt-4 text-xs text-abyssal-blue/70">
        * Campos obligatorios únicamente si están visibles
      </p>

      <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Volver
        </Button>
        <Button type="button" variant="primary" onClick={handleNext}>
          Siguiente →
        </Button>
      </div>
    </main>
  );
}