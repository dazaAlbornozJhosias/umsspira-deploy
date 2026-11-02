import { cn } from '@/shared/utils/cn';

/**
 * Respuestas que mira la barra. Coincide con los campos de use-survey-form (T1.2):
 * condicion_laboral true = Trabaja, false = No trabaja, null = sin selección.
 */
export interface SurveyProgressValues {
  condicion_laboral: boolean | null;
  cargo: string;
  empresa: string;
  area: string;
  modalidad: string;
  salario_mensual: string;
  tiempo_insercion: string;
}

const WORK_QUESTIONS = ['cargo', 'empresa', 'area', 'modalidad', 'salario_mensual', 'tiempo_insercion'] as const;

function isAnswered(field: (typeof WORK_QUESTIONS)[number], value: string): boolean {
  // El tiempo de inserción es un número de meses: «0» también cuenta como respondido.
  if (field === 'tiempo_insercion') return /^\d+$/.test(value.trim());
  return value.trim().length > 0;
}

/**
 * HU-002 / T2.4: porcentaje de preguntas visibles respondidas, redondeado a entero.
 * Con «Trabaja» cuentan las 6 preguntas laborales; con «No trabaja» no queda ninguna visible
 * y se muestra 100 %; sin condición elegida, 0 %.
 */
export function calculateSurveyProgress(values: SurveyProgressValues): number {
  if (values.condicion_laboral === false) return 100;
  if (values.condicion_laboral !== true) return 0;
  const answered = WORK_QUESTIONS.filter((field) => isAnswered(field, values[field] ?? '')).length;
  return Math.round((answered / WORK_QUESTIONS.length) * 100);
}

interface SurveyProgressBarProps {
  values: SurveyProgressValues;
}

/** Barra «N % completado» de la sección «Información laboral» (CA de la HU-2). */
export function SurveyProgressBar({ values }: SurveyProgressBarProps) {
  const percent = calculateSurveyProgress(values);
  const complete = percent === 100;

  return (
    <div className="min-w-0">
      <p className={cn('text-right text-sm font-semibold', complete ? 'text-green-700' : 'text-abyssal-blue')}>
        {percent} % completado
      </p>
      <div
        role="progressbar"
        aria-label="Progreso de la información laboral"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-palladian"
      >
        <div
          className={cn('h-full rounded-full transition-all', complete ? 'bg-green-600' : 'bg-truffle-trouble')}
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-1 text-xs text-abyssal-blue/60">
        El progreso considera solo las preguntas visibles y completas.
      </p>
    </div>
  );
}
